"""
Legal retrieval service — keyword and semantic search over ingested legal chunks.
In development, returns placeholder results when the knowledge base is empty.
"""
import logging
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from api.models.models import LegalDocument, LegalChunk
from api.schemas.schemas import LegalSearchResult

logger = logging.getLogger(__name__)

# Static known Indian legal sources for citation
KNOWN_LEGAL_SOURCES = [
    {
        "title": "Bharatiya Nyaya Sanhita, 2023",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/20062/1/the_bharatiya_nyaya_sanhita_2023.pdf",
        "authority": "Parliament of India",
        "type": "Central Act",
        "note": "Replaced IPC; in force from 1 July 2024",
    },
    {
        "title": "Bharatiya Nagarik Suraksha Sanhita, 2023",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/20063/1/the_bharatiya_nagarik_suraksha_sanhita_2023.pdf",
        "authority": "Parliament of India",
        "type": "Central Act",
        "note": "Replaced CrPC; in force from 1 July 2024",
    },
    {
        "title": "Consumer Protection Act, 2019",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/12091/1/consumer-protection-act-2019.pdf",
        "authority": "Parliament of India",
        "type": "Central Act",
        "note": "",
    },
    {
        "title": "Information Technology Act, 2000",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/1999/3/A2000-21.pdf",
        "authority": "Parliament of India",
        "type": "Central Act",
        "note": "Amended by IT (Amendment) Act, 2008",
    },
    {
        "title": "Hindu Marriage Act, 1955",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2055/1/HinduMarriageAct1955.pdf",
        "authority": "Parliament of India",
        "type": "Central Act",
        "note": "",
    },
    {
        "title": "Protection of Women from Domestic Violence Act, 2005",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/15436/1/protection_of_women_from_domestic_violence_act_2005.pdf",
        "authority": "Parliament of India",
        "type": "Central Act",
        "note": "",
    },
    {
        "title": "Code on Wages, 2019",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/12994/1/code-on-wages-2019.pdf",
        "authority": "Parliament of India",
        "type": "Central Act",
        "note": "",
    },
    {
        "title": "Limitation Act, 1963",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/1606/1/197936.pdf",
        "authority": "Parliament of India",
        "type": "Central Act",
        "note": "",
    },
    {
        "title": "Transfer of Property Act, 1882",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2338/1/A1882-04.pdf",
        "authority": "Parliament of India",
        "type": "Central Act",
        "note": "",
    },
    {
        "title": "Indian Contract Act, 1872",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2187/1/A1872-09.pdf",
        "authority": "Parliament of India",
        "type": "Central Act",
        "note": "",
    },
    {
        "title": "Motor Vehicles Act, 1988",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/1798/1/198859.pdf",
        "authority": "Parliament of India",
        "type": "Central Act",
        "note": "Amended by MV (Amendment) Act, 2019",
    },
    {
        "title": "NALSA — National Legal Services Authority",
        "url": "https://nalsa.gov.in/",
        "authority": "NALSA",
        "type": "Official Body",
        "note": "Free legal aid helpline: 15100",
    },
]

KEYWORD_MAP = {
    "consumer": ["consumer", "complaint", "refund", "product", "service", "defective", "ecommerce", "online shopping"],
    "property": ["property", "landlord", "tenant", "rent", "deposit", "lease", "land", "flat", "apartment"],
    "employment": ["salary", "employer", "employee", "wages", "termination", "gratuity", "labour", "pf", "esi"],
    "criminal": ["fir", "arrest", "police", "crime", "accused", "bail", "complaint", "bns", "ipc"],
    "family": ["divorce", "marriage", "custody", "maintenance", "alimony", "adoption", "hma", "hindu", "dowry"],
    "cyber": ["cyber", "online fraud", "hacking", "phishing", "data", "it act", "digital", "social media"],
    "motor": ["traffic", "challan", "accident", "vehicle", "license", "driving"],
    "contract": ["contract", "agreement", "breach", "clause", "sign", "notarize"],
}


def _detect_legal_domains(query: str) -> List[str]:
    """Simple keyword-based domain detection."""
    query_lower = query.lower()
    detected = []
    for domain, keywords in KEYWORD_MAP.items():
        if any(kw in query_lower for kw in keywords):
            detected.append(domain)
    return detected or ["general"]


def _get_relevant_sources(domains: List[str], limit: int = 3) -> List[dict]:
    """Return the most relevant known sources for detected domains."""
    domain_source_map = {
        "consumer": ["Consumer Protection Act, 2019"],
        "property": ["Transfer of Property Act, 1882", "Limitation Act, 1963"],
        "employment": ["Code on Wages, 2019"],
        "criminal": ["Bharatiya Nyaya Sanhita, 2023", "Bharatiya Nagarik Suraksha Sanhita, 2023"],
        "family": ["Hindu Marriage Act, 1955", "Protection of Women from Domestic Violence Act, 2005"],
        "cyber": ["Information Technology Act, 2000"],
        "motor": ["Motor Vehicles Act, 1988"],
        "contract": ["Indian Contract Act, 1872"],
        "general": ["NALSA — National Legal Services Authority"],
    }

    relevant_titles = set()
    for domain in domains:
        relevant_titles.update(domain_source_map.get(domain, []))

    # Always include NALSA
    relevant_titles.add("NALSA — National Legal Services Authority")

    results = []
    for source in KNOWN_LEGAL_SOURCES:
        if source["title"] in relevant_titles:
            results.append(source)
        if len(results) >= limit:
            break
    return results


async def search_legal_knowledge(
    query: str,
    db: AsyncSession,
    limit: int = 5,
) -> List[LegalSearchResult]:
    """
    Search the legal knowledge base.
    First tries DB chunks (if any ingested), then falls back to static source mapping.
    """
    try:
        # Try full-text keyword search in DB
        result = await db.execute(
            select(LegalChunk, LegalDocument)
            .join(LegalDocument, LegalChunk.document_id == LegalDocument.id)
            .where(
                text("to_tsvector('english', legal_chunks.chunk_text) @@ plainto_tsquery('english', :query)")
            )
            .limit(limit)
            .params(query=query)
        )
        rows = result.all()

        if rows:
            return [
                LegalSearchResult(
                    document_id=str(doc.id),
                    chunk_id=str(chunk.id),
                    title=doc.title,
                    url=doc.official_url,
                    excerpt=chunk.chunk_text[:500],
                    relevance_score=0.8,
                )
                for chunk, doc in rows
            ]
    except Exception as e:
        logger.warning(f"DB search failed (knowledge base may be empty): {e}")

    # Fallback: static source mapping
    domains = _detect_legal_domains(query)
    sources = _get_relevant_sources(domains, limit=limit)
    return [
        LegalSearchResult(
            document_id="static",
            chunk_id="static",
            title=s["title"],
            url=s["url"],
            excerpt=f"Official source: {s['title']}. {s.get('note', '')}".strip(),
            relevance_score=0.6,
        )
        for s in sources
    ]


async def get_all_sources(db: AsyncSession) -> List[dict]:
    """Return all indexed legal documents."""
    try:
        result = await db.execute(
            select(LegalDocument).order_by(LegalDocument.title)
        )
        docs = result.scalars().all()
        if docs:
            return [
                {
                    "id": str(d.id),
                    "title": d.title,
                    "url": d.official_url,
                    "type": d.document_type,
                    "status": d.current_status,
                }
                for d in docs
            ]
    except Exception:
        pass
    return [{"id": "static", "title": s["title"], "url": s["url"], "type": s["type"]} for s in KNOWN_LEGAL_SOURCES]

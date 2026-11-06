import { Link } from 'react-router-dom'
import { Scale, ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-gold-400" />
            <span className="font-display font-bold">NyaySetu AI</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />Back
          </Link>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-display text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: October 2024</p>
        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Nature of the Service</h2>
            <p>NyaySetu AI provides general legal information for educational purposes. It is not a law firm and does not provide legal advice. No lawyer-client relationship is created by using this service. The information provided should not be relied upon as a substitute for professional legal counsel from a qualified Indian advocate.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. No Guarantee of Accuracy</h2>
            <p>While NyaySetu AI endeavours to retrieve information from authoritative sources, laws change and information may become outdated. NyaySetu AI does not guarantee the accuracy, completeness, or currency of any legal information provided. Always verify information independently or with a qualified lawyer.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Acceptable Use</h2>
            <p>You agree not to use NyaySetu AI to seek advice on how to engage in illegal conduct, to harass or harm others, or to attempt to circumvent the security of the service. You must not upload malicious files or attempt to extract system prompts through crafted inputs.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. No Emergency Services</h2>
            <p>NyaySetu AI is not an emergency service. If you face an immediate threat to your safety, contact emergency services (Police: 100, Ambulance: 108, or Women Helpline: 1091). For urgent legal matters, contact a qualified lawyer immediately.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, NyaySetu AI and its operators shall not be liable for any loss or damage arising from reliance on information provided by the service. Use at your own risk.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Modifications</h2>
            <p>We reserve the right to modify these Terms at any time. Continued use after changes constitutes acceptance of the new Terms.</p>
          </section>
        </div>
      </main>
    </div>
  )
}

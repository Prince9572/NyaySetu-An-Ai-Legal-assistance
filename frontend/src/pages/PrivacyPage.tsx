import { Link } from 'react-router-dom'
import { Scale, ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
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
        <h1 className="font-display text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: October 2024</p>
        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
            <p>We collect: your email address and name when you create an account; the legal questions and conversations you have with NyaySetu AI; documents you upload for analysis; usage data such as pages visited and features used.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Third-Party AI Processing</h2>
            <p><strong className="text-foreground">Important:</strong> Your conversation content is sent to a third-party AI provider (such as Google Gemini) to generate responses. By using NyaySetu AI, you consent to this processing. Do not share sensitive information (such as Aadhaar numbers, complete bank credentials, or passwords) in conversations. The AI provider's privacy policy applies to data processed by their systems.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. How We Use Your Data</h2>
            <p>We use your data to provide the NyaySetu AI service, maintain your conversation history, improve the service based on aggregated and anonymized usage patterns, and comply with applicable law.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Storage and Security</h2>
            <p>Your data is stored securely using Supabase (PostgreSQL). Conversations are access-controlled and can only be accessed by you. We use HTTPS for all data transmission. No system is perfectly secure — do not share highly sensitive personal information.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Your Rights</h2>
            <p>You can export your conversation data and delete your account from your account settings. Account deletion will remove your profile and conversation data from our systems, subject to our data retention schedules and applicable legal obligations.</p>
          </section>
          <section id="disclaimer">
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Legal Disclaimer</h2>
            <p>NyaySetu AI is not a law firm. No information provided constitutes legal advice. No lawyer-client privilege applies to conversations with NyaySetu AI. NyaySetu AI is not affiliated with any government body, court, Bar Council of India, or law enforcement agency. Do not make legal decisions based solely on AI-generated information.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Digital Personal Data Protection Act, 2023</h2>
            <p>NyaySetu AI is designed to comply with applicable Indian data protection requirements. We will update our practices as the Digital Personal Data Protection Act, 2023 and its rules come into force. Contact us with privacy concerns.</p>
          </section>
        </div>
      </main>
    </div>
  )
}

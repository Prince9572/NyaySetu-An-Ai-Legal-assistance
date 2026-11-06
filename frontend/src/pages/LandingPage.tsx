import { Link } from 'react-router-dom'
import {
  Scale,
  MessageSquare,
  Shield,
  BookOpen,
  FileText,
  Users,
  ChevronRight,
  Star,
  CheckCircle2,
  ArrowRight,
  Home,
  Briefcase,
  ShoppingCart,
  Heart,
  Zap,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { Moon, Sun } from 'lucide-react'

const EXAMPLE_QUESTIONS = [
  { icon: Home, text: 'My landlord refuses to return my security deposit.', domain: 'Property' },
  { icon: Briefcase, text: 'My employer has not paid my salary for 3 months.', domain: 'Employment' },
  { icon: ShoppingCart, text: 'I have a consumer complaint against an online platform.', domain: 'Consumer' },
  { icon: FileText, text: 'I received a legal notice and do not understand it.', domain: 'Legal Notice' },
  { icon: Heart, text: 'I want to understand the divorce procedure in India.', domain: 'Family' },
  { icon: Shield, text: 'Someone is using my photos without permission online.', domain: 'Cybercrime' },
]

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Grounded in Indian Law',
    desc: 'Responses are grounded in verified Indian legal sources including India Code, Supreme Court records, and official government sources.',
  },
  {
    icon: MessageSquare,
    title: 'Conversational Legal Guidance',
    desc: 'Describe your issue in plain language. NyaySetu AI asks follow-up questions to understand your situation before providing relevant information.',
  },
  {
    icon: FileText,
    title: 'Document Explanation',
    desc: 'Upload legal notices, contracts, or court documents for plain-language explanations of what they mean and what you should do.',
  },
  {
    icon: Shield,
    title: 'Privacy Focused',
    desc: "Your conversations are stored securely and associated only with your account. We don't share your legal queries with third parties for advertising.",
  },
  {
    icon: Scale,
    title: 'Balanced & Accurate',
    desc: 'NyaySetu AI clearly distinguishes between what the law says and interpretation. It never fabricates statutory sections or case citations.',
  },
  {
    icon: Zap,
    title: 'Instant, Structured Responses',
    desc: 'Get organized responses covering applicable laws, procedural options, document checklists, and practical next steps.',
  },
]

const FAQS = [
  {
    q: 'Is NyaySetu AI a substitute for a lawyer?',
    a: 'No. NyaySetu AI provides general legal information and procedural education. It is not a substitute for qualified legal advice. For any significant legal matter, consult a qualified Indian lawyer.',
  },
  {
    q: 'Which areas of Indian law does NyaySetu AI cover?',
    a: 'NyaySetu AI covers key areas of Indian law including criminal law (BNS 2023), consumer protection, property law, employment law, family law, cybercrime, motor vehicle law, and constitutional rights. Coverage is expanding.',
  },
  {
    q: 'Are the legal sources used by NyaySetu AI reliable?',
    a: 'NyaySetu AI retrieves information from official government sources including India Code, the Supreme Court of India, and relevant ministry websites. However, laws change and you should verify time-sensitive information with a lawyer.',
  },
  {
    q: 'Can I upload a legal notice or contract?',
    a: 'Yes. Authenticated users can upload PDFs and text documents for plain-language explanation. Document analysis is a general aid — it does not replace professional legal review.',
  },
  {
    q: 'How is my data protected?',
    a: 'Conversations are stored securely with user-level access controls. You can export or delete your data at any time. See our Privacy Policy for details. Note that AI responses are processed by our AI provider as described in our Privacy Policy.',
  },
  {
    q: 'Does NyaySetu AI work in Hindi?',
    a: 'Currently, NyaySetu AI primarily works in English. Hindi and other Indian language support is planned for a future release.',
  },
]

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore()
  const { resolvedTheme, setTheme, theme } = useThemeStore()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center shadow-glow group-hover:shadow-gold-glow transition-all duration-300">
                <Scale className="w-4 h-4 text-gold-400" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight">
                NyaySetu <span className="text-gold-400">AI</span>
              </span>
            </Link>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-150"
                aria-label="Toggle theme"
                id="theme-toggle-btn"
              >
                {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {isAuthenticated ? (
                <Link to="/chat">
                  <Button variant="default" size="sm">Open Chat</Button>
                </Link>
              ) : (
                <>
                  <Link to="/signin">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="default" size="sm">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-navy-900/30 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-[300px] h-[300px] bg-gold-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
            <Scale className="w-3 h-3" />
            Indian Legal AI Assistant
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-balance mb-6">
            Legal clarity.{' '}
            <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
              One conversation
            </span>{' '}
            away.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Understand Indian laws, explore your legal options, and discover practical next steps
            with an AI assistant designed to make legal information easier to understand.
          </p>

          {/* Important disclaimer */}
          <div className="inline-flex items-start gap-2 text-xs text-muted-foreground bg-secondary/60 border border-border/50 rounded-xl px-4 py-2.5 mb-10 max-w-xl text-left">
            <Shield className="w-3 h-3 mt-0.5 flex-shrink-0 text-gold-500" />
            <span>
              NyaySetu AI provides <strong>general legal information</strong>, not personalized legal advice.
              Always consult a qualified Indian lawyer for case-specific guidance.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={isAuthenticated ? '/chat' : '/signup'} id="hero-cta-primary">
              <Button variant="gold" size="lg" className="gap-2 w-full sm:w-auto">
                Start a Legal Conversation
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#examples" id="hero-cta-secondary">
              <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                Explore What You Can Ask
                <ChevronRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Example Questions */}
      <section id="examples" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-3">What can you ask?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Describe your situation in your own words. NyaySetu AI understands everyday language.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXAMPLE_QUESTIONS.map((item, i) => (
              <Link
                key={i}
                to={isAuthenticated ? '/chat' : '/signup'}
                className="group glass-card rounded-2xl p-5 hover:border-primary/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1.5">{item.domain}</p>
                    <p className="text-sm text-foreground leading-relaxed">"{item.text}"</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-3">How NyaySetu AI Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A transparent, step-by-step process designed for accuracy and trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: MessageSquare,
                title: 'Describe Your Issue',
                desc: 'Explain your legal problem in plain language. No legal jargon needed.',
              },
              {
                step: '02',
                icon: BookOpen,
                title: 'AI Researches the Law',
                desc: 'NyaySetu searches verified Indian legal sources and asks follow-up questions to understand your situation.',
              },
              {
                step: '03',
                icon: CheckCircle2,
                title: 'Get Clear Guidance',
                desc: 'Receive a structured response with applicable laws, options, procedure, and next steps — with sources.',
              },
            ].map((item) => (
              <div key={item.step} className="relative glass-card rounded-2xl p-6">
                <div className="text-5xl font-display font-bold text-primary/10 mb-4">{item.step}</div>
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-3">Built for Indian Legal Needs</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every feature designed with accuracy, privacy, and accessibility in mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 hover:border-border transition-colors duration-200">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-gold-500" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Sources Banner */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <Globe className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-display text-xl font-bold mb-2">Authoritative Legal Sources</h2>
                <p className="text-sm text-muted-foreground">
                  NyaySetu AI retrieves information from official Indian government legal databases and sources:
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'India Code (indiacode.nic.in)',
                'Supreme Court of India',
                'eCourts (ecourts.gov.in)',
                'Department of Justice',
                'NALSA (nalsa.gov.in)',
                'Ministry of Law & Justice',
              ].map((source) => (
                <div key={source} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gold-500 flex-shrink-0" />
                  {source}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-4">
              All legal information is provided for educational purposes. Laws change and vary by state and circumstance.
              NyaySetu AI never fabricates citations, sections, or case names. Always verify with a qualified lawyer.
            </p>
          </div>
        </div>
      </section>

      {/* Limitations Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-500 text-xs font-medium mb-6">
            <Shield className="w-3 h-3" />
            Important Limitations
          </div>
          <h2 className="font-display text-2xl font-bold mb-4">What NyaySetu AI Cannot Do</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-sm">
            Understanding these limitations helps you use NyaySetu AI appropriately and safely.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {[
              'Provide personalized legal advice or represent you in court',
              'Guarantee a specific legal outcome in your case',
              'Replace a consultation with a qualified Indian lawyer',
              'Access confidential court records or case files',
              'Verify the accuracy of documents you upload',
              'Provide emergency legal representation or bail assistance',
            ].map((limitation) => (
              <div key={limitation} className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/40 rounded-xl px-4 py-3">
                <span className="text-destructive font-bold flex-shrink-0 mt-0.5">✗</span>
                {limitation}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold mb-2 text-sm">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center mx-auto mb-6 shadow-glow">
            <Scale className="w-8 h-8 text-gold-400" />
          </div>
          <h2 className="font-display text-4xl font-bold mb-4">
            Ready to understand your legal situation?
          </h2>
          <p className="text-muted-foreground mb-8">
            Start a conversation with NyaySetu AI — describe your issue in your own words.
          </p>
          <Link to={isAuthenticated ? '/chat' : '/signup'} id="bottom-cta-btn">
            <Button variant="gold" size="lg" className="gap-2">
              Start for Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-4">
            No credit card required. General legal information is free.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-gold-400" />
              <span className="font-display font-bold text-sm">NyaySetu AI</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground justify-center">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/privacy#disclaimer" className="hover:text-foreground transition-colors">Legal Disclaimer</Link>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              © 2024 NyaySetu AI. General legal information only. Not a law firm.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center max-w-3xl mx-auto">
              <strong>Disclaimer:</strong> NyaySetu AI provides general legal information for educational purposes only.
              It is not a substitute for professional legal advice, and no lawyer-client relationship is created by using this service.
              Laws vary by state and change over time. Always verify information with a qualified Indian advocate.
              NyaySetu AI is not affiliated with any government body, court, Bar Council, or law enforcement agency.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

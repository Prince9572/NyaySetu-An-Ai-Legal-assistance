import { useNavigate } from 'react-router-dom'
import {
  Home, Briefcase, ShoppingCart, Heart, Shield, FileText, Scale, Zap
} from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'

const SUGGESTIONS = [
  { id: 'rights', icon: Scale, title: 'Understand My Legal Rights', prompt: 'I want to understand my basic legal rights as an Indian citizen.' },
  { id: 'notice', icon: FileText, title: 'Explain a Legal Notice', prompt: 'I received a legal notice and I do not understand it. Can you help me understand what it means?' },
  { id: 'property', icon: Home, title: 'Property & Rental Disputes', prompt: 'I have a property or rental dispute. Can you explain my legal options?' },
  { id: 'employment', icon: Briefcase, title: 'Employment & Salary Issues', prompt: 'My employer has not paid my salary. What are my legal options under Indian employment law?' },
  { id: 'consumer', icon: ShoppingCart, title: 'Consumer Complaints', prompt: 'I have a consumer complaint against a company. How do I file a consumer complaint in India?' },
  { id: 'family', icon: Heart, title: 'Family Law Information', prompt: 'I need information about family law in India, such as divorce, maintenance, or custody.' },
  { id: 'cyber', icon: Shield, title: 'Cybercrime & Online Fraud', prompt: 'I am a victim of online fraud or cybercrime. What legal steps can I take in India?' },
  { id: 'procedure', icon: Zap, title: 'Court Procedures', prompt: 'Can you explain how to file a case in court in India and what the general procedure involves?' },
]

export default function WelcomeScreen() {
  const { sendMessage, createConversation, setActiveConversation } = useChatStore()
  const navigate = useNavigate()

  const handleSuggestion = async (prompt: string) => {
    const conv = await createConversation()
    setActiveConversation(conv.id)
    navigate(`/chat/${conv.id}`)
    await sendMessage(prompt)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 animate-fade-in-up">
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center mb-6 shadow-glow">
        <Scale className="w-8 h-8 text-gold-400" />
      </div>

      <h1 className="font-display text-3xl md:text-4xl font-bold text-center mb-3">
        How can NyaySetu AI help you today?
      </h1>
      <p className="text-muted-foreground text-center max-w-xl mb-10 leading-relaxed">
        Describe your legal concern in your own words. We'll help you understand the law,
        explore your options, and identify practical next steps.
      </p>

      {/* Suggestion cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-4xl">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.id}
            id={`suggestion-${s.id}`}
            onClick={() => handleSuggestion(s.prompt)}
            className="group text-left glass-card rounded-2xl p-4 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <s.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground leading-snug">{s.title}</p>
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-10 max-w-lg text-center">
        <p className="text-xs text-muted-foreground/70 leading-relaxed">
          NyaySetu AI provides general legal information, not personalized legal advice.
          Always consult a qualified Indian lawyer for important legal matters.
        </p>
      </div>
    </div>
  )
}

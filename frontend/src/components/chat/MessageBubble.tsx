import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Copy, RefreshCw, ThumbsUp, ThumbsDown, AlertCircle,
  ExternalLink, User, Scale, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useChatStore } from '@/stores/chatStore'
import { cn, formatMessageTime } from '@/lib/utils'
import type { Message } from '@/types'
import toast from 'react-hot-toast'

// Typing indicator
export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-fade-in-up">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center flex-shrink-0 shadow-glow">
        <Scale className="w-4 h-4 text-gold-400" />
      </div>
      <div className="chat-message-assistant px-4 py-3">
        <div className="flex gap-1.5 items-center h-5">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
          <span className="text-xs text-muted-foreground ml-2">NyaySetu AI is thinking…</span>
        </div>
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  onRegenerate?: () => void
}

export function MessageBubble({ message, isStreaming, onRegenerate }: MessageBubbleProps) {
  const { addFeedback } = useChatStore()
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null)
  const [showSources, setShowSources] = useState(false)
  const isUser = message.role === 'user'
  const isError = message.status === 'error'
  const isInterrupted = message.status === 'interrupted'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    toast.success('Copied to clipboard')
  }

  const handleFeedback = async (rating: 1 | -1) => {
    const type = rating === 1 ? 'up' : 'down'
    if (feedbackGiven === type) return
    setFeedbackGiven(type)
    try {
      await addFeedback(message.id, rating)
      toast.success(rating === 1 ? 'Thanks for the feedback!' : 'Thanks — we\'ll work to improve.')
    } catch {
      toast.error('Could not save feedback')
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in-up">
        <div className="max-w-[80%] md:max-w-[65%]">
          <div className="chat-message-user">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-xs text-muted-foreground/50 mt-1 text-right pr-1">
            {formatMessageTime(message.createdAt)}
          </p>
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div className="flex items-start gap-3 animate-fade-in-up">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center flex-shrink-0 shadow-glow mt-0.5">
        <Scale className="w-4 h-4 text-gold-400" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Error state */}
        {isError && (
          <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-2xl rounded-tl-sm px-4 py-3 mb-2">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-destructive font-medium">Response failed</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {message.content || 'An error occurred while generating the response.'}
              </p>
            </div>
          </div>
        )}

        {/* Interrupted state */}
        {isInterrupted && !message.content && (
          <div className="text-xs text-muted-foreground italic mb-2 px-1">
            Generation was stopped.
          </div>
        )}

        {/* Content */}
        {message.content && !isError && (
          <div className="chat-message-assistant">
            <div className="markdown-body text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
            {isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-primary/70 animate-pulse ml-0.5 align-middle" />
            )}
          </div>
        )}

        {/* Legal Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showSources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {message.sources.length} legal source{message.sources.length !== 1 ? 's' : ''}
            </button>
            {showSources && (
              <div className="mt-2 space-y-2 animate-fade-in">
                {message.sources.map((source, i) => (
                  <a
                    key={source.id || i}
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border/50 hover:border-primary/30 transition-colors group"
                  >
                    <ExternalLink className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-primary group-hover:underline truncate">
                        {source.sourceTitle}
                      </p>
                      {source.relevantExcerpt && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {source.relevantExcerpt}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions (only for completed messages) */}
        {!isStreaming && message.status === 'completed' && (
          <div className="flex items-center gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity [.flex:hover_&]:opacity-100">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
              title="Copy response"
              aria-label="Copy response"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
                title="Regenerate response"
                aria-label="Regenerate response"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="w-px h-4 bg-border mx-1" />
            <button
              onClick={() => handleFeedback(1)}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                feedbackGiven === 'up'
                  ? 'text-green-500 bg-green-500/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80',
              )}
              title="Helpful"
              aria-label="Mark as helpful"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleFeedback(-1)}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                feedbackGiven === 'down'
                  ? 'text-destructive bg-destructive/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80',
              )}
              title="Not helpful"
              aria-label="Mark as not helpful"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error retry */}
        {isError && onRegenerate && (
          <Button variant="outline" size="sm" onClick={onRegenerate} className="mt-2 gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}

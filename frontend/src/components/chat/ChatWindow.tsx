import { useRef, useEffect } from 'react'
import { MessageBubble, TypingIndicator } from './MessageBubble'
import { useChatStore } from '@/stores/chatStore'
import type { Message } from '@/types'

interface ChatWindowProps {
  messages: Message[]
  conversationId: string
}

export default function ChatWindow({ messages, conversationId }: ChatWindowProps) {
  const { isStreaming, streamingMessageId } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isStreaming])

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className="group">
            <MessageBubble
              message={message}
              isStreaming={isStreaming && message.id === streamingMessageId}
            />
          </div>
        ))}

        {/* Show typing indicator if streaming but no streaming message yet */}
        {isStreaming && messages.length > 0 &&
          messages[messages.length - 1]?.role === 'user' && (
          <TypingIndicator />
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}

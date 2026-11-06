import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '@/components/sidebar/Sidebar'
import TopNav from '@/components/layout/TopNav'
import ChatWindow from '@/components/chat/ChatWindow'
import MessageComposer from '@/components/chat/MessageComposer'
import WelcomeScreen from '@/components/chat/WelcomeScreen'
import { useChatStore } from '@/stores/chatStore'
import { cn } from '@/lib/utils'

export default function ChatPage() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const {
    conversations,
    messages,
    isLoadingMessages,
    sidebarOpen,
    loadConversations,
    setActiveConversation,
    createConversation,
  } = useChatStore()

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Sync active conversation with URL param
  useEffect(() => {
    if (conversationId) {
      setActiveConversation(conversationId)
    }
  }, [conversationId])

  const activeConversation = conversationId
    ? conversations.find((c) => c.id === conversationId) || null
    : null

  const activeMessages = conversationId ? (messages[conversationId] || []) : []

  const handleNewChat = async () => {
    navigate('/chat')
    setActiveConversation(null)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar onNewChat={handleNewChat} />

      {/* Main content */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-300',
          sidebarOpen ? 'md:ml-[260px]' : '',
        )}
      >
        {/* Top navigation */}
        <TopNav conversation={activeConversation} />

        {/* Chat area */}
        {conversationId ? (
          <>
            {isLoadingMessages && activeMessages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex gap-1.5">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            ) : (
              <ChatWindow messages={activeMessages} conversationId={conversationId} />
            )}
          </>
        ) : (
          <WelcomeScreen />
        )}

        {/* Message composer */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-border/30 bg-background/50">
          <div className="max-w-3xl mx-auto">
            <MessageComposer conversationId={conversationId} />
          </div>
        </div>
      </div>
    </div>
  )
}

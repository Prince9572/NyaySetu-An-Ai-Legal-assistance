import { create } from 'zustand'
import type { Conversation, Message, LegalSource, FollowUpQuestion, UploadedDocument } from '@/types'
import { conversationApi, messageApi, streamChat } from '@/services/api'
import { generateConversationTitle } from '@/lib/utils'

interface ChatState {
  conversations: Conversation[]
  activeConversationId: string | null
  messages: Record<string, Message[]>
  isLoadingConversations: boolean
  isLoadingMessages: boolean
  isStreaming: boolean
  streamingMessageId: string | null
  streamingContent: string
  pendingDocuments: UploadedDocument[]
  searchQuery: string
  sidebarOpen: boolean

  // Actions
  loadConversations: () => Promise<void>
  loadMessages: (conversationId: string) => Promise<void>
  createConversation: (title?: string) => Promise<Conversation>
  setActiveConversation: (id: string | null) => void
  updateConversation: (id: string, data: Partial<Pick<Conversation, 'title' | 'isPinned'>>) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  sendMessage: (content: string, documentIds?: string[]) => Promise<void>
  stopStreaming: () => void
  addFeedback: (messageId: string, rating: 1 | -1, text?: string) => Promise<void>
  addPendingDocument: (doc: UploadedDocument) => void
  removePendingDocument: (id: string) => void
  setSearchQuery: (query: string) => void
  setSidebarOpen: (open: boolean) => void
  abortController: AbortController | null
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isLoadingConversations: false,
  isLoadingMessages: false,
  isStreaming: false,
  streamingMessageId: null,
  streamingContent: '',
  pendingDocuments: [],
  searchQuery: '',
  sidebarOpen: true,
  abortController: null,

  loadConversations: async () => {
    set({ isLoadingConversations: true })
    try {
      const response = await conversationApi.list()
      set({ conversations: response.items })
    } catch (error) {
      console.error('[Chat] Failed to load conversations:', error)
    } finally {
      set({ isLoadingConversations: false })
    }
  },

  loadMessages: async (conversationId: string) => {
    set({ isLoadingMessages: true })
    try {
      const messages = await messageApi.list(conversationId)
      set((state) => ({
        messages: { ...state.messages, [conversationId]: messages },
      }))
    } catch (error) {
      console.error('[Chat] Failed to load messages:', error)
    } finally {
      set({ isLoadingMessages: false })
    }
  },

  createConversation: async (title?: string) => {
    const conversation = await conversationApi.create(title)
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    }))
    return conversation
  },

  setActiveConversation: (id: string | null) => {
    set({ activeConversationId: id })
    if (id) {
      const { messages } = get()
      if (!messages[id]) {
        get().loadMessages(id)
      }
    }
  },

  updateConversation: async (id: string, data) => {
    const updated = await conversationApi.update(id, data)
    set((state) => ({
      conversations: state.conversations.map((c) => (c.id === id ? updated : c)),
    }))
  },

  deleteConversation: async (id: string) => {
    await conversationApi.delete(id)
    set((state) => {
      const { [id]: _, ...remainingMessages } = state.messages
      return {
        conversations: state.conversations.filter((c) => c.id !== id),
        messages: remainingMessages,
        activeConversationId:
          state.activeConversationId === id ? null : state.activeConversationId,
      }
    })
  },

  sendMessage: async (content: string, documentIds: string[] = []) => {
    const { activeConversationId, pendingDocuments } = get()
    let conversationId = activeConversationId

    // Create conversation if none active
    if (!conversationId) {
      const conversation = await get().createConversation(generateConversationTitle(content))
      conversationId = conversation.id
      set({ activeConversationId: conversationId })
    }

    // Add user message to state immediately
    const userMessageId = `temp-user-${Date.now()}`
    const userMessage: Message = {
      id: userMessageId,
      conversationId,
      role: 'user',
      content,
      status: 'completed',
      modelName: null,
      sources: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId!]: [...(state.messages[conversationId!] || []), userMessage],
      },
    }))

    // Add streaming assistant placeholder
    const assistantMessageId = `temp-assistant-${Date.now()}`
    const assistantMessage: Message = {
      id: assistantMessageId,
      conversationId,
      role: 'assistant',
      content: '',
      status: 'streaming',
      modelName: null,
      sources: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId!]: [...(state.messages[conversationId!] || []), assistantMessage],
      },
      isStreaming: true,
      streamingMessageId: assistantMessageId,
      streamingContent: '',
    }))

    // Stream the response
    const abortController = new AbortController()
    set({ abortController })

    const allDocIds = [
      ...documentIds,
      ...pendingDocuments.filter((d) => d.conversationId === conversationId).map((d) => d.id),
    ]

    let accumulatedContent = ''
    let finalSources: LegalSource[] = []

    try {
      await streamChat(
        conversationId,
        content,
        allDocIds,
        (chunk) => {
          if (chunk.type === 'text' && chunk.content) {
            accumulatedContent += chunk.content
            set((state) => ({
              streamingContent: accumulatedContent,
              messages: {
                ...state.messages,
                [conversationId!]: (state.messages[conversationId!] || []).map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: accumulatedContent }
                    : m,
                ),
              },
            }))
          } else if (chunk.type === 'sources' && chunk.sources) {
            finalSources = chunk.sources
          } else if (chunk.type === 'done') {
            // Finalize the message
            set((state) => ({
              isStreaming: false,
              streamingMessageId: null,
              streamingContent: '',
              messages: {
                ...state.messages,
                [conversationId!]: (state.messages[conversationId!] || []).map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, status: 'completed', sources: finalSources }
                    : m,
                ),
              },
            }))
            // Reload to get server-assigned IDs
            get().loadMessages(conversationId!)
          } else if (chunk.type === 'error') {
            set((state) => ({
              isStreaming: false,
              streamingMessageId: null,
              messages: {
                ...state.messages,
                [conversationId!]: (state.messages[conversationId!] || []).map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        status: 'error',
                        content: chunk.error || 'An error occurred while generating the response.',
                      }
                    : m,
                ),
              },
            }))
          }
        },
        abortController.signal,
      )
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        set((state) => ({
          isStreaming: false,
          streamingMessageId: null,
          messages: {
            ...state.messages,
            [conversationId!]: (state.messages[conversationId!] || []).map((m) =>
              m.id === assistantMessageId
                ? { ...m, status: 'interrupted' }
                : m,
            ),
          },
        }))
      } else {
        const errorMsg = (error as Error).message || 'Failed to get response'
        set((state) => ({
          isStreaming: false,
          streamingMessageId: null,
          messages: {
            ...state.messages,
            [conversationId!]: (state.messages[conversationId!] || []).map((m) =>
              m.id === assistantMessageId
                ? { ...m, status: 'error', content: errorMsg }
                : m,
            ),
          },
        }))
      }
    }
  },

  stopStreaming: () => {
    const { abortController } = get()
    if (abortController) {
      abortController.abort()
    }
    set({ isStreaming: false, streamingMessageId: null, abortController: null })
  },

  addFeedback: async (messageId: string, rating: 1 | -1, text?: string) => {
    await messageApi.feedback(messageId, rating, text)
  },

  addPendingDocument: (doc) =>
    set((state) => ({ pendingDocuments: [...state.pendingDocuments, doc] })),

  removePendingDocument: (id) =>
    set((state) => ({
      pendingDocuments: state.pendingDocuments.filter((d) => d.id !== id),
    })),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}))

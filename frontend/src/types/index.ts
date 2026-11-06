// Shared TypeScript types across the application

export type Theme = 'dark' | 'light' | 'system'

export type MessageRole = 'user' | 'assistant' | 'system'

export type MessageStatus = 'pending' | 'streaming' | 'completed' | 'error' | 'interrupted'

export type ConversationStatus = 'active' | 'archived'

export type FeedbackRating = 1 | -1

export type LegalDomain =
  | 'criminal'
  | 'civil'
  | 'family'
  | 'property'
  | 'employment'
  | 'consumer'
  | 'cybercrime'
  | 'contract'
  | 'constitutional'
  | 'motor_vehicle'
  | 'tax'
  | 'intellectual_property'
  | 'other'

export interface User {
  id: string
  email: string
  displayName: string | null
  preferredLanguage: string
  themePreference: Theme
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  id: string
  userId: string
  title: string
  isPinned: boolean
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface LegalSource {
  id: string
  messageId: string
  sourceUrl: string
  sourceTitle: string
  relevantExcerpt: string | null
  citationMetadata: Record<string, unknown>
}

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  status: MessageStatus
  modelName: string | null
  sources: LegalSource[]
  createdAt: string
  updatedAt: string
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
}

export interface Feedback {
  id: string
  userId: string
  conversationId: string
  messageId: string
  rating: FeedbackRating
  feedbackText: string | null
  createdAt: string
}

export interface UploadedDocument {
  id: string
  userId: string
  conversationId: string
  originalFilename: string
  mimeType: string
  fileSize: number
  processingStatus: 'pending' | 'processing' | 'ready' | 'failed'
  createdAt: string
}

export interface ApiError {
  detail: string
  code?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface SuggestionCard {
  id: string
  icon: string
  title: string
  description: string
  prompt: string
}

export interface FollowUpQuestion {
  id: string
  text: string
}

export interface StreamChunk {
  type: 'text' | 'sources' | 'follow_ups' | 'error' | 'done'
  content?: string
  sources?: LegalSource[]
  followUps?: FollowUpQuestion[]
  error?: string
}

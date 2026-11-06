import { supabase } from '@/lib/supabase'
import type {
  Conversation,
  Message,
  LegalSource,
  UploadedDocument,
  PaginatedResponse,
  StreamChunk,
} from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  return headers
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers || {}),
    },
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(errorBody.detail || `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

// ─── Conversations ────────────────────────────────────────────────────────────

export const conversationApi = {
  list: (page = 1, pageSize = 50) =>
    apiFetch<PaginatedResponse<Conversation>>(
      `/api/conversations?page=${page}&page_size=${pageSize}`
    ),

  create: (title?: string) =>
    apiFetch<Conversation>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ title: title || 'New Conversation' }),
    }),

  get: (id: string) =>
    apiFetch<Conversation>(`/api/conversations/${id}`),

  update: (id: string, data: Partial<Pick<Conversation, 'title' | 'isPinned'>>) =>
    apiFetch<Conversation>(`/api/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/api/conversations/${id}`, { method: 'DELETE' }),
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messageApi = {
  list: (conversationId: string) =>
    apiFetch<Message[]>(`/api/conversations/${conversationId}/messages`),

  feedback: (messageId: string, rating: 1 | -1, feedbackText?: string) =>
    apiFetch<{ message: string }>(`/api/messages/${messageId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, feedback_text: feedbackText }),
    }),
}

// ─── AI / Chat Streaming ──────────────────────────────────────────────────────

export async function streamChat(
  conversationId: string,
  content: string,
  documentIds: string[],
  onChunk: (chunk: StreamChunk) => void,
  signal?: AbortSignal,
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  }
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const response = await fetch(`${API_BASE}/api/assistant/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      conversation_id: conversationId,
      content,
      document_ids: documentIds,
    }),
    signal,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(errorBody.detail || `HTTP ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') return
        try {
          const chunk = JSON.parse(data) as StreamChunk
          onChunk(chunk)
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}

// ─── Legal Sources ─────────────────────────────────────────────────────────────

export const legalApi = {
  search: (query: string, limit = 5) =>
    apiFetch<{ results: LegalSource[] }>(`/api/legal/search?q=${encodeURIComponent(query)}&limit=${limit}`),

  getSources: () =>
    apiFetch<{ sources: Array<{ id: string; title: string; url: string }> }>('/api/legal/sources'),
}

// ─── Documents ────────────────────────────────────────────────────────────────

export const documentApi = {
  upload: async (file: File, conversationId: string): Promise<UploadedDocument> => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const formData = new FormData()
    formData.append('file', file)
    formData.append('conversation_id', conversationId)

    const headers: HeadersInit = {}
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const res = await fetch(`${API_BASE}/api/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(errorBody.detail || `Upload failed: HTTP ${res.status}`)
    }

    return res.json() as Promise<UploadedDocument>
  },

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/api/documents/${id}`, { method: 'DELETE' }),
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export const profileApi = {
  get: () => apiFetch<{ id: string; email: string; display_name: string | null; preferred_language: string }>('/api/profile'),

  update: (data: { display_name?: string; preferred_language?: string; theme_preference?: string }) =>
    apiFetch<{ message: string }>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: () =>
    apiFetch<{ message: string }>('/api/profile', { method: 'DELETE' }),
}

// ─── Health ───────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => fetch(`${API_BASE}/health`).then((r) => r.json()),
}

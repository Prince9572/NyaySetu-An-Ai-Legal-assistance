import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, isToday, isYesterday, subDays, isAfter } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  return formatDistanceToNow(date, { addSuffix: true })
}

export function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  return format(date, 'h:mm a')
}

export function groupConversationsByDate<T extends { createdAt: string }>(items: T[]): {
  today: T[]
  yesterday: T[]
  last7Days: T[]
  older: T[]
} {
  const now = new Date()
  const sevenDaysAgo = subDays(now, 7)

  return items.reduce(
    (acc, item) => {
      const date = new Date(item.createdAt)
      if (isToday(date)) {
        acc.today.push(item)
      } else if (isYesterday(date)) {
        acc.yesterday.push(item)
      } else if (isAfter(date, sevenDaysAgo)) {
        acc.last7Days.push(item)
      } else {
        acc.older.push(item)
      }
      return acc
    },
    { today: [] as T[], yesterday: [] as T[], last7Days: [] as T[], older: [] as T[] },
  )
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

export function generateConversationTitle(firstMessage: string): string {
  return truncateText(firstMessage.trim(), 40)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (typeof error === 'object' && error !== null && 'detail' in error) {
    return String((error as { detail: unknown }).detail)
  }
  return 'An unexpected error occurred'
}

export const ALLOWED_UPLOAD_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const MAX_UPLOAD_SIZE_MB = 10
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Send, Square, Paperclip, X, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useChatStore } from '@/stores/chatStore'
import { documentApi } from '@/services/api'
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_SIZE_BYTES, formatFileSize } from '@/lib/utils'
import type { UploadedDocument } from '@/types'
import toast from 'react-hot-toast'

interface MessageComposerProps {
  conversationId?: string
}

export default function MessageComposer({ conversationId }: MessageComposerProps) {
  const { sendMessage, stopStreaming, isStreaming, pendingDocuments, addPendingDocument, removePendingDocument } = useChatStore()
  const [content, setContent] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [content])

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [conversationId])

  const handleSend = async () => {
    const trimmed = content.trim()
    if (!trimmed || isStreaming) return

    setContent('')
    const docIds = pendingDocuments.map((d) => d.id)
    await sendMessage(trimmed, docIds)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !conversationId) return

    // Validate
    if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
      toast.error('Unsupported file type. Please upload PDF or text files.')
      return
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      toast.error(`File too large. Maximum size is 10MB.`)
      return
    }

    setIsUploading(true)
    try {
      const doc = await documentApi.upload(file, conversationId)
      addPendingDocument(doc)
      toast.success(`${file.name} uploaded successfully`)
    } catch (err) {
      toast.error(`Upload failed: ${(err as Error).message}`)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const currentConvDocs = pendingDocuments.filter(
    (d) => !conversationId || d.conversationId === conversationId
  )

  return (
    <div className="relative">
      {/* Attached documents */}
      {currentConvDocs.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {currentConvDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-2 bg-secondary/60 border border-border/50 rounded-xl px-3 py-1.5 text-xs"
            >
              <FileText className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="max-w-[120px] truncate text-foreground">{doc.originalFilename}</span>
              <span className="text-muted-foreground">{formatFileSize(doc.fileSize)}</span>
              <button
                onClick={() => removePendingDocument(doc.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                aria-label={`Remove ${doc.originalFilename}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer box */}
      <div className="relative bg-card/80 border border-border/80 rounded-2xl overflow-hidden focus-within:border-primary/50 transition-colors duration-150">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your legal issue or ask a question…"
          className="w-full px-4 py-3.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none leading-relaxed"
          style={{ minHeight: '52px', maxHeight: '200px' }}
          disabled={isStreaming}
          id="message-composer-input"
          aria-label="Message input"
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/30">
          <div className="flex items-center gap-1">
            {/* File upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload-input"
              disabled={isUploading || !conversationId}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !conversationId}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title={conversationId ? 'Attach document' : 'Start a conversation first'}
              aria-label="Attach document"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-primary/50 border-t-primary rounded-full animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Send / Stop button */}
          {isStreaming ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={stopStreaming}
              className="gap-2 h-8"
              id="stop-generation-btn"
            >
              <Square className="w-3 h-3 fill-current" />
              Stop
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon"
              onClick={handleSend}
              disabled={!content.trim()}
              className="h-8 w-8 rounded-xl"
              id="send-message-btn"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Privacy note */}
      <p className="text-center text-xs text-muted-foreground/60 mt-2 px-4">
        Please avoid sharing passwords, financial credentials, or unnecessary sensitive personal information.
        AI responses are for informational purposes only.
      </p>
    </div>
  )
}

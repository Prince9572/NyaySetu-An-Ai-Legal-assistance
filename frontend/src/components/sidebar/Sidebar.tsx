import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Plus, Search, Pin, Trash2, Edit3, MoreHorizontal,
  Scale, MessageSquare, ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/Dialog'
import { useChatStore } from '@/stores/chatStore'
import { groupConversationsByDate, cn } from '@/lib/utils'
import type { Conversation } from '@/types'

interface SidebarProps {
  onNewChat: () => void
}

function ConversationItem({ conv, isActive, onSelect, onRename, onDelete, onPin }: {
  conv: Conversation
  isActive: boolean
  onSelect: () => void
  onRename: (title: string) => void
  onDelete: () => void
  onPin: () => void
}) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(conv.title)
  const renameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming && renameRef.current) {
      renameRef.current.focus()
      renameRef.current.select()
    }
  }, [isRenaming])

  const handleRenameSubmit = () => {
    if (renameValue.trim()) {
      onRename(renameValue.trim())
    }
    setIsRenaming(false)
  }

  return (
    <div
      className={cn(
        'sidebar-item group relative pr-1',
        isActive && 'active',
      )}
      onClick={() => !isRenaming && onSelect()}
    >
      {conv.isPinned && (
        <Pin className="w-3 h-3 text-gold-500 flex-shrink-0" />
      )}
      {!conv.isPinned && (
        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
      )}

      {isRenaming ? (
        <input
          ref={renameRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRenameSubmit()
            if (e.key === 'Escape') { setIsRenaming(false); setRenameValue(conv.title) }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent text-sm outline-none border-b border-primary/50 focus:border-primary"
        />
      ) : (
        <span className="flex-1 truncate text-sm">{conv.title}</span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-secondary/80 transition-all duration-150"
            aria-label="Conversation options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsRenaming(true) }}>
            <Edit3 className="w-3.5 h-3.5 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin() }}>
            <Pin className="w-3.5 h-3.5 mr-2" />
            {conv.isPinned ? 'Unpin' : 'Pin'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem danger onClick={(e) => { e.stopPropagation(); onDelete() }}>
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function ConversationGroup({ label, convs, activeId, onSelect, onRename, onDelete, onPin }: {
  label: string
  convs: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
  onPin: (id: string, pinned: boolean) => void
}) {
  if (!convs.length) return null
  return (
    <div className="mb-4">
      <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{label}</p>
      {convs.map((conv) => (
        <ConversationItem
          key={conv.id}
          conv={conv}
          isActive={conv.id === activeId}
          onSelect={() => onSelect(conv.id)}
          onRename={(title) => onRename(conv.id, title)}
          onDelete={() => onDelete(conv.id)}
          onPin={() => onPin(conv.id, !conv.isPinned)}
        />
      ))}
    </div>
  )
}

export default function Sidebar({ onNewChat }: SidebarProps) {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const {
    conversations, isLoadingConversations,
    setActiveConversation, updateConversation, deleteConversation,
    searchQuery, setSearchQuery, sidebarOpen, setSidebarOpen,
  } = useChatStore()

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filteredConvs = searchQuery
    ? conversations.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations

  // Separate pinned from regular
  const pinned = filteredConvs.filter((c) => c.isPinned)
  const unpinned = filteredConvs.filter((c) => !c.isPinned)
  const grouped = groupConversationsByDate(unpinned)

  const handleSelect = (id: string) => {
    setActiveConversation(id)
    navigate(`/chat/${id}`)
  }

  const handleRename = async (id: string, title: string) => {
    await updateConversation(id, { title })
  }

  const handleDelete = async (id: string) => {
    await deleteConversation(id)
    if (conversationId === id) {
      navigate('/chat')
    }
    setDeleteTarget(null)
  }

  const handlePin = async (id: string, isPinned: boolean) => {
    await updateConversation(id, { isPinned })
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-30 flex flex-col bg-card/95 backdrop-blur-md border-r border-border',
          'transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-[260px]' : 'w-0 md:w-[260px]',
          !sidebarOpen && 'md:w-[260px]',
        )}
        style={{ width: sidebarOpen ? 260 : 0 }}
      >
        <div className="flex flex-col h-full min-w-[260px]">
          {/* Logo header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center">
                <Scale className="w-3.5 h-3.5 text-gold-400" />
              </div>
              <span className="font-display font-bold text-base">
                NyaySetu <span className="text-gold-400">AI</span>
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded-lg hover:bg-secondary/80 text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat */}
          <div className="px-3 py-3">
            <Button
              variant="default"
              className="w-full gap-2 justify-start"
              onClick={onNewChat}
              id="new-chat-btn"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </Button>
          </div>

          {/* Search */}
          <div className="px-3 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
                id="conversation-search"
              />
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto px-2 py-1">
            {isLoadingConversations ? (
              <div className="space-y-2 px-3 pt-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-9 rounded-xl bg-secondary/50 shimmer" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Start by clicking "New Conversation"</p>
              </div>
            ) : (
              <>
                {pinned.length > 0 && (
                  <ConversationGroup
                    label="Pinned"
                    convs={pinned}
                    activeId={conversationId || null}
                    onSelect={handleSelect}
                    onRename={handleRename}
                    onDelete={(id) => setDeleteTarget(id)}
                    onPin={handlePin}
                  />
                )}
                <ConversationGroup label="Today" convs={grouped.today} activeId={conversationId || null} onSelect={handleSelect} onRename={handleRename} onDelete={(id) => setDeleteTarget(id)} onPin={handlePin} />
                <ConversationGroup label="Yesterday" convs={grouped.yesterday} activeId={conversationId || null} onSelect={handleSelect} onRename={handleRename} onDelete={(id) => setDeleteTarget(id)} onPin={handlePin} />
                <ConversationGroup label="Previous 7 Days" convs={grouped.last7Days} activeId={conversationId || null} onSelect={handleSelect} onRename={handleRename} onDelete={(id) => setDeleteTarget(id)} onPin={handlePin} />
                <ConversationGroup label="Older" convs={grouped.older} activeId={conversationId || null} onSelect={handleSelect} onRename={handleRename} onDelete={(id) => setDeleteTarget(id)} onPin={handlePin} />
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              id="confirm-delete-btn"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

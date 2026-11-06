import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Menu, Sun, Moon, Edit3, Scale, LogOut, User, Settings, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/DropdownMenu'
import { useChatStore } from '@/stores/chatStore'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { cn, truncateText } from '@/lib/utils'
import type { Conversation } from '@/types'

interface TopNavProps {
  conversation: Conversation | null
}

export default function TopNav({ conversation }: TopNavProps) {
  const { setSidebarOpen, sidebarOpen, updateConversation } = useChatStore()
  const { user, signOut } = useAuthStore()
  const { resolvedTheme, setTheme } = useThemeStore()
  const navigate = useNavigate()
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')

  const handleStartRename = () => {
    if (!conversation) return
    setRenameValue(conversation.title)
    setIsRenaming(true)
  }

  const handleRenameSubmit = async () => {
    if (!conversation || !renameValue.trim()) { setIsRenaming(false); return }
    await updateConversation(conversation.id, { title: renameValue.trim() })
    setIsRenaming(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border/50 bg-background/80 backdrop-blur-sm flex-shrink-0">
      {/* Left: menu + title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
          aria-label="Toggle sidebar"
          id="sidebar-toggle-btn"
        >
          <Menu className="w-4 h-4" />
        </button>

        {conversation ? (
          <div className="flex items-center gap-2 min-w-0">
            {isRenaming ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit()
                  if (e.key === 'Escape') setIsRenaming(false)
                }}
                className="bg-transparent border-b border-primary/50 text-sm font-medium outline-none w-64 max-w-[50vw]"
                id="conversation-rename-input"
              />
            ) : (
              <>
                <h1 className="text-sm font-medium text-foreground truncate max-w-[30vw] md:max-w-sm">
                  {truncateText(conversation.title, 50)}
                </h1>
                <button
                  onClick={handleStartRename}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-all"
                  aria-label="Rename conversation"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        ) : (
          <Link to="/" className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-gold-400" />
            <span className="font-display font-semibold text-sm hidden sm:block">NyaySetu AI</span>
          </Link>
        )}
      </div>

      {/* Right: theme + profile */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
          aria-label="Toggle theme"
          id="app-theme-toggle"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Profile menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-secondary/80 transition-all"
              id="profile-menu-btn"
              aria-label="Profile menu"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/80 to-navy-800 flex items-center justify-center text-xs font-bold text-white">
                {initials}
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="font-medium text-sm text-foreground truncate">{user?.displayName || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-3.5 h-3.5 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem danger onClick={handleSignOut}>
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

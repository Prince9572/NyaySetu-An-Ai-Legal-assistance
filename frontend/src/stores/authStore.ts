import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'
import type { Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
  initializeAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null, isAuthenticated: false })
      },

      initializeAuth: async () => {
        set({ isLoading: true })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            const supaUser = session.user
            const user: User = {
              id: supaUser.id,
              email: supaUser.email || '',
              displayName: supaUser.user_metadata?.display_name || supaUser.email?.split('@')[0] || null,
              preferredLanguage: supaUser.user_metadata?.preferred_language || 'en',
              themePreference: supaUser.user_metadata?.theme_preference || 'dark',
              createdAt: supaUser.created_at,
              updatedAt: supaUser.updated_at || supaUser.created_at,
            }
            set({ session, user, isAuthenticated: true })
          }
        } catch (error) {
          console.error('[Auth] Failed to initialize:', error)
        } finally {
          set({ isLoading: false })
        }

        // Listen for auth state changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (session) {
            const supaUser = session.user
            const user: User = {
              id: supaUser.id,
              email: supaUser.email || '',
              displayName: supaUser.user_metadata?.display_name || supaUser.email?.split('@')[0] || null,
              preferredLanguage: supaUser.user_metadata?.preferred_language || 'en',
              themePreference: supaUser.user_metadata?.theme_preference || 'dark',
              createdAt: supaUser.created_at,
              updatedAt: supaUser.updated_at || supaUser.created_at,
            }
            set({ session, user, isAuthenticated: true, isLoading: false })
          } else {
            set({ session: null, user: null, isAuthenticated: false, isLoading: false })
          }
        })
      },
    }),
    {
      name: 'nyaysetu-auth',
      partialize: (state) => ({ user: state.user }),
    },
  ),
)

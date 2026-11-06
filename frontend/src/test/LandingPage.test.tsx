import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LandingPage from '@/pages/LandingPage'

// Mock stores
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ isAuthenticated: false }),
}))
vi.mock('@/stores/themeStore', () => ({
  useThemeStore: () => ({ resolvedTheme: 'dark', setTheme: vi.fn(), theme: 'dark' }),
}))

describe('LandingPage', () => {
  it('renders the hero heading', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Legal clarity/i)).toBeDefined()
  })

  it('shows the primary CTA button', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Start a Legal Conversation/i)).toBeDefined()
  })

  it('shows the legal disclaimer', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/general legal information/i)).toBeDefined()
  })
})

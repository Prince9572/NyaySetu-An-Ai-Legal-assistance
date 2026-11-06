import * as React from 'react'
import { cn } from '@/lib/utils'

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gold'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    isLoading?: boolean
  }
>(({ className, variant = 'default', size = 'default', isLoading, children, disabled, ...props }, ref) => {
  const base =
    'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]'

  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-glow',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-border bg-transparent hover:bg-secondary/80 text-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-secondary/80 text-muted-foreground hover:text-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
    gold: 'bg-gold-500 text-black hover:bg-gold-400 font-semibold hover:shadow-gold-glow',
  }

  const sizes = {
    default: 'h-10 px-5 py-2',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-12 px-8 text-base',
    icon: 'h-9 w-9',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      ref={ref}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
})
Button.displayName = 'Button'

export { Button }

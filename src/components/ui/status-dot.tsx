import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

const statusDotVariants = cva('inline-block size-2 shrink-0 rounded-full', {
  variants: {
    tone: {
      neutral: 'bg-muted-foreground',
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      destructive: 'bg-destructive',
    },
    pulse: { true: 'animate-status-pulse' },
  },
  defaultVariants: { tone: 'neutral', pulse: false },
})

export function StatusDot({ className, tone, pulse, ...props }: ComponentProps<'span'> & VariantProps<typeof statusDotVariants>) {
  return <span aria-hidden="true" className={cn(statusDotVariants({ tone, pulse }), className)} data-slot="status-dot" {...props} />
}

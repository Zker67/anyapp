import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex min-h-5 max-w-full min-w-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] leading-[1.35] font-bold tracking-[0.02em] whitespace-normal',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-white/[0.045] text-[var(--text-soft)]',
        primary: 'border-primary/30 bg-primary/10 text-primary',
        success: 'border-success/28 bg-success/10 text-success',
        warning: 'border-warning/30 bg-warning/10 text-warning',
        destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
        outline: 'border-border bg-transparent text-foreground',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

export function Badge({ className, variant, ...props }: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} data-slot="badge" {...props} />
}

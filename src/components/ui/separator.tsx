import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export function Separator({ className, ...props }: ComponentProps<'div'>) {
  return <div aria-hidden="true" className={cn('h-px w-full bg-[var(--border-muted)]', className)} data-slot="separator" {...props} />
}

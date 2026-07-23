import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn('min-h-20 w-full resize-y rounded-md border border-border bg-[var(--field-background)] px-3 py-2 text-sm leading-6 text-foreground shadow-[var(--inner-light)] outline-none transition-[border-color,box-shadow,background] duration-150 placeholder:text-muted-foreground hover:border-[var(--border-bright)] focus-visible:border-[var(--border-bright)] focus-visible:shadow-[var(--focus-shadow)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none', className)} data-slot="textarea" {...props} />
}

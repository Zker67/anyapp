import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export function Spinner({ className, ...props }: ComponentProps<'span'>) {
  return <span aria-hidden="true" className={cn('inline-block size-4 animate-spin rounded-full border-2 border-current/30 border-t-current motion-reduce:animate-none', className)} data-slot="spinner" {...props} />
}

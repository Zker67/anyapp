import { Input as InputPrimitive } from '@base-ui/react/input'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <InputPrimitive
      className={cn('h-9 w-full min-w-0 rounded-md border border-border bg-[var(--field-background)] px-3 text-sm text-foreground shadow-[var(--inner-light)] outline-none transition-[border-color,box-shadow,background] duration-150 placeholder:text-muted-foreground hover:border-[var(--border-bright)] focus-visible:border-[var(--border-bright)] focus-visible:shadow-[var(--focus-shadow)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none', className)}
      data-slot="input"
      type={type}
      {...props}
    />
  )
}

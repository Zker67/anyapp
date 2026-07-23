import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Field({ label, hint, error, required, children, className, ...props }: ComponentProps<'div'> & { label?: ReactNode; hint?: ReactNode; error?: ReactNode; required?: boolean }) {
  return (
    <div className={cn('group/field grid min-w-0 gap-1.5', className)} data-invalid={Boolean(error) || undefined} data-slot="field" {...props}>
      {label ? <span className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-soft)]">{label}{required ? <span className="text-[10px] font-medium text-warning">必填</span> : null}</span> : null}
      {children}
      {error ? <p className="text-[11px] leading-5 text-destructive" role="alert">{error}</p> : hint ? <p className="text-[11px] leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

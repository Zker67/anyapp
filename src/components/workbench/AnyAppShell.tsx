import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export function AnyAppShell({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('workbench-shell', className)} data-slot="anyapp-shell" {...props} />
}

export function WorkbenchTopbar({ className, ...props }: ComponentProps<'header'>) {
  return <header className={cn('workbench-topbar', className)} data-slot="workbench-topbar" {...props} />
}

export function WorkbenchRail({ className, ...props }: ComponentProps<'aside'>) {
  return <aside className={cn('workbench-rail', className)} data-slot="workbench-rail" {...props} />
}

export function WorkbenchMain({ className, ...props }: ComponentProps<'main'>) {
  return <main className={cn('workbench-main', className)} data-slot="workbench-main" {...props} />
}

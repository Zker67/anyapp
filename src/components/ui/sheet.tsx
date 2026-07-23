import { Dialog as SheetPrimitive } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'
import { Button } from './button'

export const Sheet = SheetPrimitive.Root

export function SheetContent({ className, children, ...props }: SheetPrimitive.Popup.Props) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px] transition-opacity duration-180 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
      <SheetPrimitive.Popup className={cn('fixed inset-y-0 right-0 z-50 grid h-full w-[min(520px,94vw)] grid-rows-[auto_minmax(0,1fr)_auto] border-l border-[var(--border-bright)] bg-[var(--drawer-background)] text-sm text-popover-foreground shadow-[var(--overlay-shadow)] outline-none transition-transform duration-200 data-ending-style:translate-x-full data-starting-style:translate-x-full motion-reduce:transition-none', className)} data-slot="sheet-content" {...props}>
        {children}
        <SheetPrimitive.Close render={<Button aria-label="关闭设置" className="absolute top-3 right-3" size="icon-sm" variant="ghost" />}>
          <X />
        </SheetPrimitive.Close>
      </SheetPrimitive.Popup>
    </SheetPrimitive.Portal>
  )
}

export function SheetHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex min-h-[62px] min-w-0 flex-col justify-center gap-1 border-b border-[var(--border-muted)] px-5 py-4 pr-14', className)} data-slot="sheet-header" {...props} />
}

export function SheetBody({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('min-h-0 overflow-y-auto px-5 py-4', className)} data-slot="sheet-body" {...props} />
}

export function SheetFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex min-w-0 flex-wrap items-center gap-2 border-t border-[var(--border-muted)] px-5 py-3.5', className)} data-slot="sheet-footer" {...props} />
}

export function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return <SheetPrimitive.Title className={cn('font-heading text-base font-bold', className)} data-slot="sheet-title" {...props} />
}

export function SheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return <SheetPrimitive.Description className={cn('text-xs leading-5 text-muted-foreground', className)} data-slot="sheet-description" {...props} />
}

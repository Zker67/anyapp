import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'
import { Button } from './button'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogContent({ className, children, showCloseButton = true, ...props }: DialogPrimitive.Popup.Props & { showCloseButton?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
      <DialogPrimitive.Popup
        className={cn('fixed top-1/2 left-1/2 z-50 grid max-h-[min(760px,92vh)] w-[min(680px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-[var(--border-bright)] bg-[var(--surface-raised)] text-sm text-popover-foreground shadow-[var(--overlay-shadow),var(--inner-light)] outline-none transition-[opacity,transform] duration-180 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none', className)}
        data-slot="dialog-content"
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close render={<Button aria-label="关闭" className="absolute top-3 right-3" size="icon-sm" variant="ghost" />}>
            <X />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex min-w-0 flex-col gap-1 border-b border-[var(--border-muted)] px-5 py-4 pr-14', className)} data-slot="dialog-header" {...props} />
}

export function DialogBody({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('min-h-0 overflow-y-auto px-5 py-4', className)} data-slot="dialog-body" {...props} />
}

export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex min-w-0 flex-wrap items-center justify-end gap-2 border-t border-[var(--border-muted)] px-5 py-3.5', className)} data-slot="dialog-footer" {...props} />
}

export function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title className={cn('font-heading text-base font-bold tracking-tight', className)} data-slot="dialog-title" {...props} />
}

export function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return <DialogPrimitive.Description className={cn('text-xs leading-5 text-muted-foreground', className)} data-slot="dialog-description" {...props} />
}

import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'
import { Button } from './button'

export const AlertDialog = AlertDialogPrimitive.Root

export function AlertDialogContent({ className, ...props }: AlertDialogPrimitive.Popup.Props) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-[2px] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
      <AlertDialogPrimitive.Popup className={cn('fixed top-1/2 left-1/2 z-[60] grid w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-[var(--border-bright)] bg-[var(--surface-raised)] p-5 text-popover-foreground shadow-[var(--overlay-shadow)] outline-none transition-[opacity,transform] duration-180 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none', className)} data-slot="alert-dialog-content" {...props} />
    </AlertDialogPrimitive.Portal>
  )
}

export function AlertDialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('grid gap-1.5', className)} data-slot="alert-dialog-header" {...props} />
}

export function AlertDialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} data-slot="alert-dialog-footer" {...props} />
}

export function AlertDialogTitle({ className, ...props }: AlertDialogPrimitive.Title.Props) {
  return <AlertDialogPrimitive.Title className={cn('font-heading text-base font-bold', className)} data-slot="alert-dialog-title" {...props} />
}

export function AlertDialogDescription({ className, ...props }: AlertDialogPrimitive.Description.Props) {
  return <AlertDialogPrimitive.Description className={cn('text-sm leading-6 text-muted-foreground', className)} data-slot="alert-dialog-description" {...props} />
}

export function AlertDialogAction({ className, ...props }: ComponentProps<typeof Button>) {
  return <Button className={className} data-slot="alert-dialog-action" {...props} />
}

export function AlertDialogCancel({ className, ...props }: AlertDialogPrimitive.Close.Props) {
  return <AlertDialogPrimitive.Close className={className} data-slot="alert-dialog-cancel" render={<Button variant="outline" />} {...props} />
}

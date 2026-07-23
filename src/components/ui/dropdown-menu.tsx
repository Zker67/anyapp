import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export const DropdownMenu = MenuPrimitive.Root
export const DropdownMenuTrigger = MenuPrimitive.Trigger

export function DropdownMenuContent({ align = 'end', side = 'bottom', sideOffset = 6, className, ...props }: MenuPrimitive.Popup.Props & Pick<MenuPrimitive.Positioner.Props, 'align' | 'side' | 'sideOffset'>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner align={align} className="isolate z-[70] outline-none" side={side} sideOffset={sideOffset}>
        <MenuPrimitive.Popup className={cn('min-w-48 origin-(--transform-origin) overflow-hidden rounded-md border border-[var(--menu-border)] bg-[var(--menu-solid)] p-1 text-popover-foreground shadow-[var(--menu-shadow)] outline-none transition-[opacity,transform] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none', className)} data-slot="dropdown-menu-content" {...props} />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

export function DropdownMenuItem({ className, variant = 'default', ...props }: MenuPrimitive.Item.Props & { variant?: 'default' | 'destructive' }) {
  return <MenuPrimitive.Item className={cn('relative flex cursor-default items-center gap-2 rounded-sm px-2.5 py-2 text-[13px] outline-none select-none transition-colors duration-100 focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0', variant === 'destructive' && 'text-destructive focus:bg-destructive/12 focus:text-destructive', className)} data-slot="dropdown-menu-item" {...props} />
}

export function DropdownMenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return <MenuPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-[var(--menu-divider)]', className)} data-slot="dropdown-menu-separator" {...props} />
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('px-2.5 py-1.5 text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase', className)} data-slot="dropdown-menu-label" {...props} />
}

export function DropdownMenuShortcut({ className, ...props }: ComponentProps<'span'>) {
  return <span className={cn('ml-auto text-[10px] text-muted-foreground', className)} data-slot="dropdown-menu-shortcut" {...props} />
}

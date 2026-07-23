import { Select as SelectPrimitive } from '@base-ui/react/select'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export const Select = SelectPrimitive.Root

export function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value className={cn('flex min-w-0 flex-1 items-center gap-1.5 text-left leading-5', className)} data-slot="select-value" {...props} />
}

export function SelectTrigger({ className, size = 'default', children, ...props }: SelectPrimitive.Trigger.Props & { size?: 'sm' | 'default' }) {
  return (
    <SelectPrimitive.Trigger
      className={cn('group/select-trigger flex w-fit min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-[var(--field-background)] px-3 text-sm text-foreground shadow-[var(--inner-light)] outline-none select-none transition-[border-color,background,box-shadow] duration-150 hover:border-[var(--border-bright)] focus-visible:border-[var(--border-bright)] focus-visible:shadow-[var(--focus-shadow)] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 motion-reduce:transition-none', className)}
      data-size={size}
      data-slot="select-trigger"
      {...props}
    >
      {children}
      <SelectPrimitive.Icon render={<span className="pointer-events-none size-3 shrink-0 bg-current opacity-55 [clip-path:polygon(14%_30%,50%_68%,86%_30%,100%_44%,50%_94%,0_44%)] transition-transform duration-180 data-popup-open:rotate-180 motion-reduce:transition-none" />} />
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({ className, children, side = 'bottom', sideOffset = 5, align = 'center', alignItemWithTrigger = true, ...props }: SelectPrimitive.Popup.Props & Pick<SelectPrimitive.Positioner.Props, 'align' | 'side' | 'sideOffset' | 'alignItemWithTrigger'>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner align={align} alignItemWithTrigger={alignItemWithTrigger} className="isolate z-[75]" side={side} sideOffset={sideOffset}>
        <SelectPrimitive.Popup className={cn('relative max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border border-[var(--menu-border)] bg-[var(--menu-solid)] p-1 text-popover-foreground shadow-[var(--menu-shadow)] outline-none transition-[opacity,transform] duration-160 data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0 motion-reduce:transition-none', className)} data-slot="select-content" {...props}>
          <SelectPrimitive.ScrollUpArrow className="sticky top-0 z-10 flex w-full items-center justify-center bg-[var(--menu-solid)] py-1"><ChevronUp className="size-4" /></SelectPrimitive.ScrollUpArrow>
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectPrimitive.ScrollDownArrow className="sticky bottom-0 z-10 flex w-full items-center justify-center bg-[var(--menu-solid)] py-1"><ChevronDown className="size-4" /></SelectPrimitive.ScrollDownArrow>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item className={cn('relative flex w-full cursor-default items-center gap-2 rounded-sm py-2 pr-8 pl-2.5 text-[13px] outline-none select-none transition-[background,color] duration-100 focus:bg-accent focus:text-foreground aria-selected:bg-primary/12 aria-selected:font-semibold aria-selected:text-primary data-disabled:pointer-events-none data-disabled:opacity-35', className)} data-slot="select-item" {...props}>
      <SelectPrimitive.ItemText className="flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap">{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 text-primary">✓</SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

export function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group className={cn('grid gap-0.5', className)} data-slot="select-group" {...props} />
}

export function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return <SelectPrimitive.GroupLabel className={cn('px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase', className)} data-slot="select-label" {...props} />
}

export function SelectSeparator({ className, ...props }: ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn('my-1 h-px bg-[var(--menu-divider)]', className)} data-slot="select-separator" {...props} />
}

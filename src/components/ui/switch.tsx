import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { cn } from '../../lib/utils'

export function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      className={cn('group/switch relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-border bg-black/25 shadow-[inset_0_1px_2px_rgb(0_0_0/0.35),var(--inner-light)] outline-none transition-[background,border-color,box-shadow] duration-200 data-checked:border-primary/55 data-checked:bg-primary/24 focus-visible:shadow-[var(--focus-shadow)] disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none', className)}
      data-slot="switch"
      {...props}
    >
      <SwitchPrimitive.Thumb className="absolute left-0.5 size-[18px] rounded-full bg-slate-300 shadow-[0_2px_7px_rgb(0_0_0/0.35)] transition-transform duration-200 group-data-checked/switch:translate-x-4 group-data-checked/switch:bg-primary motion-reduce:transition-none" />
    </SwitchPrimitive.Root>
  )
}

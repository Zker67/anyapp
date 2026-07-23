import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { cn } from '../../lib/utils'

export const Tabs = TabsPrimitive.Root

export function TabsList({ className, children, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      className={cn('relative isolate flex min-w-0 gap-1 overflow-x-auto rounded-md border border-border bg-black/15 p-1', className)}
      data-slot="tabs-list"
      {...props}
    >
      {children}
      <TabsPrimitive.Indicator className="absolute top-1 bottom-1 left-0 z-0 w-(--active-tab-width) translate-x-(--active-tab-left) rounded-sm bg-primary/14 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition-[translate,width] duration-150 motion-reduce:transition-none" />
    </TabsPrimitive.List>
  )
}

export function TabsTab({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      className={cn('relative z-1 inline-flex h-9 min-w-max flex-1 items-center justify-center gap-2 rounded-sm px-3 text-xs font-semibold whitespace-nowrap text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary data-active:text-foreground [&_svg]:size-4 [&_svg]:shrink-0', className)}
      data-slot="tabs-tab"
      {...props}
    />
  )
}

export function TabsPanel({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      className={cn('min-h-0 py-4 outline-none focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-primary [[hidden]]:hidden', className)}
      data-slot="tabs-panel"
      {...props}
    />
  )
}

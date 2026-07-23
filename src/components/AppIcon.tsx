import { AppWindow } from 'lucide-react'
import { useAppIcon } from '../hooks/use-anyapp'
import { cn } from '../lib/utils'

export function AppIcon({ iconKey, name, className }: { iconKey: string | null; name: string; className?: string }) {
  const icon = useAppIcon(iconKey)
  if (icon.data) return <img alt="" className={cn('size-11 rounded-lg object-contain', className)} src={icon.data} />
  const initial = name.trim().slice(0, 1).toLocaleUpperCase('zh-CN')
  return (
    <span aria-hidden="true" className={cn('grid size-11 place-items-center rounded-lg border border-border bg-[linear-gradient(145deg,rgb(68_121_238/0.16),rgb(255_255_255/0.025))] text-primary shadow-[var(--inner-light)]', className)}>
      {initial ? <span className="font-heading text-base font-bold">{initial}</span> : <AppWindow className="size-5" />}
    </span>
  )
}

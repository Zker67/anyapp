import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function SettingsBlock({ icon, title, description, actions, children, className, ...props }: ComponentProps<'section'> & { icon?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <section className={cn('settings-block', className)} data-slot="settings-block" {...props}>
      <header>
        {icon ? <span className="settings-block-icon">{icon}</span> : null}
        <span><strong>{title}</strong>{description ? <small>{description}</small> : null}</span>
      </header>
      <div className="settings-block-body">{children}</div>
      {actions ? <footer>{actions}</footer> : null}
    </section>
  )
}

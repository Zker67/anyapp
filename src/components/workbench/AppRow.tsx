import { ExternalLink, FilePenLine, FolderOpen, Heart, Link2, MoreHorizontal, Play, Trash2 } from 'lucide-react'
import { healthPresentation, portabilityLabel } from '../../lib/app-view'
import { cn, displayDate } from '../../lib/utils'
import type { AppProjection } from '../../types'
import { AppIcon } from '../AppIcon'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { StatusDot } from '../ui/status-dot'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

interface AppRowProps {
  app: AppProjection
  categoryName: string
  compact: boolean
  selected: boolean
  busy: boolean
  onLaunch: () => void
  onFavorite: () => void
  onReveal: () => void
  onWebsite: () => void
  onShortcut: () => void
  onEdit: () => void
  onDelete: () => void
}

export function AppRow(props: AppRowProps) {
  const { app, categoryName, compact, selected, busy } = props
  const health = healthPresentation[app.health]
  const launchDisabled = busy || app.health !== 'healthy'

  return (
    <article
      aria-label={`${app.name}，${health.label}`}
      className={cn('app-row', compact && 'app-row-compact', selected && 'app-row-selected', health.className)}
      data-app-selected={selected}
      onDoubleClick={launchDisabled ? undefined : props.onLaunch}
    >
      <span className="app-health-rail" aria-hidden="true" />
      <AppIcon className="app-row-icon" iconKey={app.iconKey} name={app.name} />

      <div className="app-row-content">
        <div className="app-row-title-line">
          <h2>{app.name}</h2>
          {app.favorite ? <Heart aria-label="已收藏" className="app-row-favorite-mark" /> : null}
          {app.health !== 'healthy' ? <Badge variant={health.tone}><StatusDot tone={health.tone} />{health.label}</Badge> : null}
        </div>
        <p className="app-row-secondary" title={app.description || app.resolvedPath}>{app.description || app.resolvedPath}</p>
        <div className="app-row-meta">
          <span>{categoryName}</span><i aria-hidden="true" />
          <span>{portabilityLabel(app.portability)}</span><i aria-hidden="true" />
          <span>{displayDate(app.lastLaunchedAt)}</span><i aria-hidden="true" />
          <span>启动 {app.launchCount} 次</span>
          {!compact ? app.tags.slice(0, 2).map((tag) => <span className="app-row-tag" key={tag}>#{tag}</span>) : null}
        </div>
      </div>

      <div className="app-row-actions">
        <Tooltip>
          <TooltipTrigger render={<Button aria-label={launchDisabled && app.health !== 'healthy' ? `${app.name} 路径异常，无法启动` : `启动 ${app.name}`} disabled={launchDisabled} size="icon-sm" />}>
            <Play />
          </TooltipTrigger>
          <TooltipContent>{app.health === 'healthy' ? '启动' : health.label}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button aria-label={app.favorite ? `取消收藏 ${app.name}` : `收藏 ${app.name}`} onClick={props.onFavorite} size="icon-sm" variant="ghost" />}>
            <Heart className={cn(app.favorite && 'fill-primary text-primary')} />
          </TooltipTrigger>
          <TooltipContent>{app.favorite ? '取消收藏' : '收藏'}</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button aria-label={`更多操作：${app.name}`} size="icon-sm" variant="ghost" />}>
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{app.name}</DropdownMenuLabel>
            <DropdownMenuItem onClick={props.onReveal}><FolderOpen />在资源管理器中定位</DropdownMenuItem>
            {app.website ? <DropdownMenuItem onClick={props.onWebsite}><ExternalLink />打开网站</DropdownMenuItem> : null}
            <DropdownMenuItem onClick={props.onShortcut}><Link2 />创建桌面快捷方式</DropdownMenuItem>
            <DropdownMenuItem onClick={props.onEdit}><FilePenLine />编辑</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={props.onDelete} variant="destructive"><Trash2 />删除记录</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  )
}

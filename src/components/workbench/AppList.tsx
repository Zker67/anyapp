import { AppWindow, FolderSearch, Plus, Search } from 'lucide-react'
import type { AppProjection } from '../../types'
import { Button } from '../ui/button'
import { AppRow } from './AppRow'

interface AppListProps {
  apps: AppProjection[]
  allAppsCount: number
  categoryNames: Map<string, string>
  compact: boolean
  selectedIndex: number
  busyAppId: string
  onAdd: () => void
  onScan: () => void
  onClear: () => void
  onLaunch: (app: AppProjection) => void
  onFavorite: (app: AppProjection) => void
  onReveal: (app: AppProjection) => void
  onWebsite: (app: AppProjection) => void
  onShortcut: (app: AppProjection) => void
  onEdit: (app: AppProjection) => void
  onDelete: (app: AppProjection) => void
}

export function AppList(props: AppListProps) {
  if (!props.apps.length) {
    const hasApps = props.allAppsCount > 0
    return (
      <section className="library-empty" aria-live="polite">
        <span className="library-empty-icon">{hasApps ? <Search /> : <AppWindow />}</span>
        <h2>{hasApps ? '没有匹配的软件' : '建立你的本地软件清单'}</h2>
        <p>{hasApps ? '调整搜索词或筛选条件，正式配置不会发生变化。' : '手动添加一个启动入口，或扫描软件目录后批量确认。扫描不会执行候选文件。'}</p>
        <div>
          {hasApps ? <Button onClick={props.onClear} variant="secondary">清除筛选</Button> : <><Button onClick={props.onAdd}><Plus />添加软件</Button><Button onClick={props.onScan} variant="secondary"><FolderSearch />扫描目录</Button></>}
        </div>
      </section>
    )
  }

  return (
    <section className="app-list" aria-live="polite">
      {props.apps.map((app, index) => (
        <AppRow
          key={app.id}
          app={app}
          busy={props.busyAppId === app.id}
          categoryName={props.categoryNames.get(app.categoryId ?? '') ?? '未分类'}
          compact={props.compact}
          selected={index === props.selectedIndex}
          onDelete={() => props.onDelete(app)}
          onEdit={() => props.onEdit(app)}
          onFavorite={() => props.onFavorite(app)}
          onLaunch={() => props.onLaunch(app)}
          onReveal={() => props.onReveal(app)}
          onShortcut={() => props.onShortcut(app)}
          onWebsite={() => props.onWebsite(app)}
        />
      ))}
    </section>
  )
}

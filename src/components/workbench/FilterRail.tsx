import { AppWindow, Clock3, Heart, Shapes, TriangleAlert } from 'lucide-react'
import type { AppFilter } from '../../lib/filter'
import type { AppProjection } from '../../types'
import { cn } from '../../lib/utils'
import { WorkbenchRail } from './AnyAppShell'

interface FilterRailProps {
  apps: AppProjection[]
  filter: AppFilter
  onFilterChange: (filter: AppFilter) => void
  onManageCategories: () => void
}

export function FilterRail({ apps, filter, onFilterChange, onManageCategories }: FilterRailProps) {
  const items = [
    { key: 'all' as const, label: '全部', icon: AppWindow, count: apps.length },
    { key: 'favorites' as const, label: '收藏', icon: Heart, count: apps.filter((app) => app.favorite).length },
    { key: 'recent' as const, label: '最近', icon: Clock3, count: apps.filter((app) => app.lastLaunchedAt).length },
    { key: 'missing' as const, label: '异常', icon: TriangleAlert, count: apps.filter((app) => app.health !== 'healthy').length, warning: true },
  ]

  return (
    <WorkbenchRail>
      <nav className="filter-rail-nav" aria-label="软件筛选">
        {items.map((item) => {
          const Icon = item.icon
          const active = filter === item.key
          return (
            <button
              key={item.key}
              type="button"
              aria-current={active ? 'page' : undefined}
              className={cn('filter-rail-item', active && 'filter-rail-item-active', item.warning && item.count > 0 && 'filter-rail-item-warning')}
              onClick={() => onFilterChange(item.key)}
            >
              <span className="filter-rail-icon"><Icon /></span>
              <span className="filter-rail-label">{item.label}</span>
              <span className="filter-rail-count">{item.count}</span>
            </button>
          )
        })}
      </nav>

      <button className="filter-rail-item filter-rail-manage" type="button" onClick={onManageCategories}>
        <span className="filter-rail-icon"><Shapes /></span>
        <span className="filter-rail-label">分类</span>
        <span className="filter-rail-count">管理</span>
      </button>
    </WorkbenchRail>
  )
}

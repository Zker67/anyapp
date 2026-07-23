import { ArrowDownAZ } from 'lucide-react'
import type { AppFilter, AppSort } from '../../lib/filter'
import type { Category } from '../../types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { StatusDot } from '../ui/status-dot'

interface LibraryControlsProps {
  title: string
  resultCount: number
  healthyCount: number
  issueCount: number
  filter: AppFilter
  sort: AppSort
  categories: Category[]
  onFilterChange: (filter: AppFilter) => void
  onSortChange: (sort: AppSort) => void
}

export function LibraryControls({ title, resultCount, healthyCount, issueCount, filter, sort, categories, onFilterChange, onSortChange }: LibraryControlsProps) {
  const categoryValue = filter.startsWith('category:') ? filter.slice(9) : ''
  const categoryLabel = categories.find((category) => category.id === categoryValue)?.name ?? '全部分类'
  const sortLabel = sort === 'recent' ? '按最近启动' : sort === 'launches' ? '按启动次数' : '按名称'
  return (
    <header className="library-controls">
      <div className="library-heading">
        <h1>{title}</h1><span>{resultCount} 个结果</span>
      </div>
      <div className="library-control-group">
        <Select value={categoryValue || '__all__'} onValueChange={(value) => onFilterChange(value && value !== '__all__' ? `category:${value}` : 'all')}>
          <SelectTrigger aria-label="分类筛选" className="library-select"><SelectValue>{categoryLabel}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部分类</SelectItem>
            {categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => { if (value) onSortChange(value as AppSort) }}>
          <SelectTrigger aria-label="软件排序" className="library-select library-sort-select"><ArrowDownAZ aria-hidden="true" /><SelectValue>{sortLabel}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">按名称</SelectItem>
            <SelectItem value="recent">按最近启动</SelectItem>
            <SelectItem value="launches">按启动次数</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="path-health-summary" aria-label="路径健康汇总">
        <span><StatusDot tone="success" />{healthyCount} 正常</span>
        <span className={issueCount ? 'has-issues' : undefined}><StatusDot pulse={issueCount > 0} tone={issueCount ? 'warning' : 'neutral'} />{issueCount} 异常</span>
      </div>
    </header>
  )
}

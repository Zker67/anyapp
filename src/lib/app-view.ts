import type { AppFilter } from './filter'
import type { PathHealth } from '../types'

export const healthPresentation: Record<PathHealth, { label: string; tone: 'success' | 'warning' | 'destructive'; className: string }> = {
  healthy: { label: '路径正常', tone: 'success', className: 'health-healthy' },
  missing: { label: '路径失效', tone: 'warning', className: 'health-missing' },
  unsupported: { label: '类型不支持', tone: 'destructive', className: 'health-unsafe' },
  unsafeRelative: { label: '相对路径越界', tone: 'destructive', className: 'health-unsafe' },
}

export function filterTitle(filter: AppFilter, categories: Map<string, string>) {
  if (filter === 'favorites') return '收藏'
  if (filter === 'recent') return '最近启动'
  if (filter === 'missing') return '路径异常'
  if (filter.startsWith('category:')) return categories.get(filter.slice(9)) ?? '分类'
  return '全部软件'
}

export function portabilityLabel(portability: 'portableRelative' | 'externalAbsolute') {
  return portability === 'portableRelative' ? '便携路径' : '外部路径'
}

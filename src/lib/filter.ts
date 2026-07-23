import type { AppProjection, Category } from '../types'

export type AppFilter = 'all' | 'favorites' | 'recent' | 'missing' | `category:${string}`
export type AppSort = 'name' | 'recent' | 'launches'

export interface FilterOptions {
  query: string
  filter: AppFilter
  sort: AppSort
}

export function filterAndSortApps(
  apps: AppProjection[],
  categories: Category[],
  options: FilterOptions,
): AppProjection[] {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]))
  const needle = options.query.trim().toLocaleLowerCase('zh-CN')
  const filtered = apps.filter((app) => {
    if (options.filter === 'favorites' && !app.favorite) return false
    if (options.filter === 'recent' && !app.lastLaunchedAt) return false
    if (options.filter === 'missing' && app.health === 'healthy') return false
    if (options.filter.startsWith('category:') && app.categoryId !== options.filter.slice(9)) return false
    if (!needle) return true
    const searchable = [
      app.name,
      app.description,
      app.path,
      app.resolvedPath,
      categoryNames.get(app.categoryId ?? '') ?? '',
      ...app.tags,
    ]
      .join('\n')
      .toLocaleLowerCase('zh-CN')
    return searchable.includes(needle)
  })

  return [...filtered].sort((left, right) => {
    if (left.favorite !== right.favorite) return left.favorite ? -1 : 1
    if (options.sort === 'recent') {
      return (right.lastLaunchedAt ?? '').localeCompare(left.lastLaunchedAt ?? '') || compareName(left, right)
    }
    if (options.sort === 'launches') {
      return right.launchCount - left.launchCount || compareName(left, right)
    }
    return compareName(left, right)
  })
}

function compareName(left: AppProjection, right: AppProjection) {
  return left.name.localeCompare(right.name, 'zh-CN', { numeric: true, sensitivity: 'base' })
}

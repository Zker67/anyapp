import { describe, expect, it } from 'vitest'
import { filterAndSortApps } from './filter'
import type { AppProjection, Category } from '../types'

const categories: Category[] = [{ id: 'dev', name: '开发工具', color: 'cobalt' }]

function app(index: number, overrides: Partial<AppProjection> = {}): AppProjection {
  return {
    id: `app-${index}`,
    name: `Tool ${index}`,
    path: `C:/Apps/Tool${index}.exe`,
    categoryId: 'dev',
    description: index === 42 ? '<img onerror=alert(1)>' : '本地工具',
    tags: ['效率'],
    favorite: index === 2,
    website: null,
    iconKey: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    lastLaunchedAt: index === 3 ? '2026-07-22T00:00:00Z' : null,
    launchCount: index,
    health: index === 4 ? 'missing' : 'healthy',
    resolvedPath: `C:/Apps/Tool${index}.exe`,
    portability: 'externalAbsolute',
    ...overrides,
  }
}

const apps = Array.from({ length: 100 }, (_, index) => app(index))

describe('filterAndSortApps', () => {
  it('searches name, tags, description, category and path across 100 entries', () => {
    expect(filterAndSortApps(apps, categories, { query: 'Tool 42', filter: 'all', sort: 'name' })).toHaveLength(1)
    expect(filterAndSortApps(apps, categories, { query: '效率', filter: 'all', sort: 'name' })).toHaveLength(100)
    expect(filterAndSortApps(apps, categories, { query: '开发工具', filter: 'all', sort: 'name' })).toHaveLength(100)
    expect(filterAndSortApps(apps, categories, { query: '<img', filter: 'all', sort: 'name' })[0].id).toBe('app-42')
  })

  it('filters favorites, recent and missing paths', () => {
    expect(filterAndSortApps(apps, categories, { query: '', filter: 'favorites', sort: 'name' }).map((item) => item.id)).toEqual(['app-2'])
    expect(filterAndSortApps(apps, categories, { query: '', filter: 'recent', sort: 'recent' }).map((item) => item.id)).toEqual(['app-3'])
    expect(filterAndSortApps(apps, categories, { query: '', filter: 'missing', sort: 'name' }).map((item) => item.id)).toEqual(['app-4'])
    expect(filterAndSortApps(apps, categories, { query: '', filter: 'category:dev', sort: 'name' })).toHaveLength(100)
    expect(filterAndSortApps(apps, categories, { query: '', filter: 'category:other', sort: 'name' })).toHaveLength(0)
  })

  it('sorts by recent launch and launch count while keeping favorites first', () => {
    const sample = [
      app(1, { favorite: false, launchCount: 50, lastLaunchedAt: '2026-07-21T00:00:00Z' }),
      app(2, { favorite: true, launchCount: 1, lastLaunchedAt: '2026-01-01T00:00:00Z' }),
      app(3, { favorite: false, launchCount: 100, lastLaunchedAt: '2026-07-22T00:00:00Z' }),
    ]
    expect(filterAndSortApps(sample, categories, { query: '', filter: 'all', sort: 'recent' }).map((item) => item.id)).toEqual(['app-2', 'app-3', 'app-1'])
    expect(filterAndSortApps(sample, categories, { query: '', filter: 'all', sort: 'launches' }).map((item) => item.id)).toEqual(['app-2', 'app-3', 'app-1'])
  })

  it('sorts names naturally for numbered software entries', () => {
    const sample = [app(10), app(2), app(1)].map((item) => ({ ...item, favorite: false }))
    expect(filterAndSortApps(sample, categories, { query: '', filter: 'all', sort: 'name' }).map((item) => item.id)).toEqual(['app-1', 'app-2', 'app-10'])
  })
})

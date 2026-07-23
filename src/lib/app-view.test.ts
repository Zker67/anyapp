import { describe, expect, it } from 'vitest'
import { filterTitle, healthPresentation, portabilityLabel } from './app-view'

describe('app view presentation', () => {
  it('maps each path state to visible non-color text', () => {
    expect(healthPresentation.healthy.label).toBe('路径正常')
    expect(healthPresentation.missing.label).toBe('路径失效')
    expect(healthPresentation.unsupported.label).toBe('类型不支持')
    expect(healthPresentation.unsafeRelative.label).toBe('相对路径越界')
  })

  it('resolves filter titles and unknown categories safely', () => {
    const categories = new Map([['dev', '开发工具']])
    expect(filterTitle('favorites', categories)).toBe('收藏')
    expect(filterTitle('category:dev', categories)).toBe('开发工具')
    expect(filterTitle('category:missing', categories)).toBe('分类')
  })

  it('uses concise portability labels', () => {
    expect(portabilityLabel('portableRelative')).toBe('便携路径')
    expect(portabilityLabel('externalAbsolute')).toBe('外部路径')
  })
})

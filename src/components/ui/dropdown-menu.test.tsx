import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DropdownMenuLabel } from './dropdown-menu'

describe('DropdownMenuLabel', () => {
  it('can render as a visual menu heading without requiring a menu group context', () => {
    const markup = renderToStaticMarkup(<DropdownMenuLabel>文本工具</DropdownMenuLabel>)

    expect(markup).toContain('data-slot="dropdown-menu-label"')
    expect(markup).toContain('文本工具')
  })
})

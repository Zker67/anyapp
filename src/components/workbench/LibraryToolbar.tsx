import { AppWindow, CircleHelp, FolderSearch, Plus, Search, Settings2 } from 'lucide-react'
import type { RefObject } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { WorkbenchTopbar } from './AnyAppShell'

interface LibraryToolbarProps {
  query: string
  searchRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  onScan: () => void
  onAdd: () => void
  onHelp: () => void
  onSettings: () => void
}

export function LibraryToolbar({ query, searchRef, onQueryChange, onScan, onAdd, onHelp, onSettings }: LibraryToolbarProps) {
  return (
    <WorkbenchTopbar>
      <div className="workbench-brand" aria-label="AnyApp 本地启动工作台">
        <span className="workbench-brand-mark"><AppWindow /></span>
        <span className="workbench-brand-copy"><strong>AnyApp</strong><small>本地启动工作台</small></span>
      </div>

      <label className="command-search">
        <Search aria-hidden="true" />
        <Input
          ref={searchRef}
          aria-label="搜索软件"
          placeholder="搜索名称、标签、描述、分类或路径"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <kbd>Ctrl K</kbd>
      </label>

      <div className="workbench-top-actions">
        <Button onClick={onScan} size="sm" variant="ghost"><FolderSearch /><span className="top-action-label">扫描</span></Button>
        <Button onClick={onAdd} size="sm"><Plus /><span className="top-action-label">添加软件</span></Button>
        <Button aria-label="使用说明" onClick={onHelp} size="icon-sm" title="使用说明" variant="ghost"><CircleHelp /></Button>
        <Button aria-label="数据与行为设置" onClick={onSettings} size="icon-sm" variant="ghost"><Settings2 /></Button>
      </div>
    </WorkbenchTopbar>
  )
}

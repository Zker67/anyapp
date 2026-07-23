import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppWindow, RefreshCcw, ShieldAlert, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import './App.css'
import { AppEditorDialog } from './components/AppEditorDialog'
import { CategoryDialog } from './components/CategoryDialog'
import { ConfirmDialog } from './components/ConfirmDialog'
import { DataToolsDialog } from './components/DataToolsDialog'
import { RecoveryScreen } from './components/RecoveryScreen'
import { ScanDialog } from './components/ScanDialog'
import { UsageGuideDialog } from './components/UsageGuideDialog'
import { Button } from './components/ui/button'
import { Spinner } from './components/ui/spinner'
import { AnyAppShell, WorkbenchMain } from './components/workbench/AnyAppShell'
import { AppList } from './components/workbench/AppList'
import { FilterRail } from './components/workbench/FilterRail'
import { LibraryControls } from './components/workbench/LibraryControls'
import { LibraryToolbar } from './components/workbench/LibraryToolbar'
import { useAnyAppActions, useLoadState } from './hooks/use-anyapp'
import { filterTitle } from './lib/app-view'
import { filterAndSortApps } from './lib/filter'
import { errorMessage } from './lib/utils'
import { useUiStore } from './stores/ui-store'
import type { AppConfig, AppEntry, AppProjection } from './types'

function App() {
  const loadState = useLoadState()
  const actions = useAnyAppActions()
  const { query, filter, sort, selectedIndex, setQuery, setFilter, setSort, setSelectedIndex } = useUiStore()
  const searchRef = useRef<HTMLInputElement>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<AppEntry | null>(null)
  const [scanOpen, setScanOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [dataToolsOpen, setDataToolsOpen] = useState(false)
  const [usageOpen, setUsageOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AppProjection | null>(null)
  const [websiteTarget, setWebsiteTarget] = useState<AppProjection | null>(null)
  const [busyAppId, setBusyAppId] = useState('')

  const state = loadState.data
  const view = state?.view ?? null
  const visibleApps = useMemo(
    () => view ? filterAndSortApps(view.apps, view.config.categories, { query, filter, sort }) : [],
    [filter, query, sort, view],
  )
  const categoryNames = useMemo(
    () => new Map(view?.config.categories.map((category) => [category.id, category.name]) ?? []),
    [view?.config.categories],
  )
  const selectedApp = visibleApps[Math.min(selectedIndex, Math.max(visibleApps.length - 1, 0))]
  const dialogsOpen = editorOpen || scanOpen || categoriesOpen || dataToolsOpen || usageOpen || Boolean(deleteTarget) || Boolean(websiteTarget)

  const launchApp = useCallback(async (app: AppProjection) => {
    setBusyAppId(app.id)
    try {
      const result = await actions.launch.mutateAsync(app.id)
      if (result.warning) toast.warning(result.warning)
      else toast.success(`已启动 ${app.name}`)
    } catch (cause) {
      toast.error(errorMessage(cause))
    } finally {
      setBusyAppId('')
    }
  }, [actions.launch])

  useEffect(() => {
    if (selectedIndex < visibleApps.length) return
    setSelectedIndex(Math.max(visibleApps.length - 1, 0))
  }, [selectedIndex, setSelectedIndex, visibleApps.length])

  useEffect(() => {
    document.querySelector('[data-app-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if (event.defaultPrevented) return
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName ?? ''
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName) || target?.isContentEditable
      const insideFloatingUi = Boolean(target?.closest('[data-slot="dropdown-menu-content"], [data-slot="dialog-content"], [data-slot="sheet-content"], [data-slot="alert-dialog-content"]'))

      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
        return
      }
      if (event.key === '/' && !isTyping && !dialogsOpen && !insideFloatingUi) {
        event.preventDefault()
        searchRef.current?.focus()
        return
      }
      if (dialogsOpen || insideFloatingUi || (isTyping && target !== searchRef.current)) return
      if (event.key === 'Escape' && query) {
        event.preventDefault()
        setQuery('')
        return
      }
      if (event.key === 'ArrowDown' && visibleApps.length > 0) {
        event.preventDefault()
        setSelectedIndex(Math.min(selectedIndex + 1, visibleApps.length - 1))
      }
      if (event.key === 'ArrowUp' && visibleApps.length > 0) {
        event.preventDefault()
        setSelectedIndex(Math.max(selectedIndex - 1, 0))
      }
      if (event.key === 'Enter' && selectedApp?.health === 'healthy') {
        event.preventDefault()
        void launchApp(selectedApp)
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [dialogsOpen, launchApp, query, selectedApp, selectedIndex, setQuery, setSelectedIndex, visibleApps.length])

  async function saveConfig(config: AppConfig) {
    await actions.saveConfig.mutateAsync(config)
  }

  async function toggleFavorite(app: AppProjection) {
    if (!view) return
    try {
      await saveConfig({
        ...view.config,
        apps: view.config.apps.map((item) => item.id === app.id ? { ...item, favorite: !item.favorite } : item),
      })
    } catch (cause) {
      toast.error(errorMessage(cause))
    }
  }

  async function revealApp(app: AppProjection) {
    try {
      await actions.revealApp(app.id)
    } catch (cause) {
      toast.error(errorMessage(cause))
    }
  }

  async function createShortcut(app: AppProjection) {
    try {
      const path = await actions.createDesktopShortcut(app.id)
      toast.success('桌面快捷方式已创建', { description: path })
    } catch (cause) {
      toast.error(errorMessage(cause))
    }
  }

  async function deleteApp() {
    if (!view || !deleteTarget) return
    setBusyAppId(deleteTarget.id)
    try {
      await saveConfig({ ...view.config, apps: view.config.apps.filter((app) => app.id !== deleteTarget.id) })
      toast.success(`已删除 ${deleteTarget.name}`)
      setDeleteTarget(null)
    } catch (cause) {
      toast.error(errorMessage(cause))
    } finally {
      setBusyAppId('')
    }
  }

  async function openWebsite() {
    if (!websiteTarget) return
    setBusyAppId(websiteTarget.id)
    try {
      await actions.openAppWebsite(websiteTarget.id)
      setWebsiteTarget(null)
    } catch (cause) {
      toast.error(errorMessage(cause))
    } finally {
      setBusyAppId('')
    }
  }

  function openNewApp() {
    setEditingApp(null)
    setEditorOpen(true)
  }

  function openEditor(app: AppProjection) {
    setEditingApp(app)
    setEditorOpen(true)
  }

  if (loadState.isLoading) return <LoadingScreen />

  if (loadState.isError) {
    return (
      <main className="recovery-shell">
        <section className="recovery-panel">
          <span className="recovery-symbol"><TriangleAlert /></span>
          <p className="recovery-kicker">STARTUP CHECK</p>
          <h1>无法读取本地状态</h1>
          <p>请确认当前在 Tauri 桌面环境中运行，并检查数据目录权限。</p>
          <pre className="error-panel">{errorMessage(loadState.error)}</pre>
          <Button onClick={() => loadState.refetch()}><RefreshCcw />重试</Button>
        </section>
      </main>
    )
  }

  if (state?.status === 'corrupt') {
    return <RecoveryScreen error={state.error} backups={state.backups} onRestore={async (name) => { await actions.restoreBackup.mutateAsync(name) }} onReset={async () => { await actions.resetCorrupt.mutateAsync() }} />
  }

  if (!view || !state) return <LoadingScreen />

  const healthyCount = view.apps.filter((app) => app.health === 'healthy').length
  const issueCount = view.apps.length - healthyCount

  return (
    <AnyAppShell>
      <LibraryToolbar query={query} searchRef={searchRef} onQueryChange={setQuery} onScan={() => setScanOpen(true)} onAdd={openNewApp} onHelp={() => setUsageOpen(true)} onSettings={() => setDataToolsOpen(true)} />
      <FilterRail apps={view.apps} filter={filter} onFilterChange={setFilter} onManageCategories={() => setCategoriesOpen(true)} />
      <WorkbenchMain>
        <LibraryControls
          categories={view.config.categories}
          filter={filter}
          healthyCount={healthyCount}
          issueCount={issueCount}
          resultCount={visibleApps.length}
          sort={sort}
          title={filterTitle(filter, categoryNames)}
          onFilterChange={setFilter}
          onSortChange={setSort}
        />
        <AppList
          allAppsCount={view.apps.length}
          apps={visibleApps}
          busyAppId={busyAppId}
          categoryNames={categoryNames}
          compact={view.config.settings.compactView}
          selectedIndex={selectedIndex}
          onAdd={openNewApp}
          onClear={() => { setQuery(''); setFilter('all') }}
          onDelete={setDeleteTarget}
          onEdit={openEditor}
          onFavorite={(app) => { void toggleFavorite(app) }}
          onLaunch={(app) => { void launchApp(app) }}
          onReveal={(app) => { void revealApp(app) }}
          onScan={() => setScanOpen(true)}
          onShortcut={(app) => { void createShortcut(app) }}
          onWebsite={setWebsiteTarget}
        />
        <footer className="library-footer">
          <span><ShieldAlert />{issueCount ? `${issueCount} 项路径需要处理` : '所有路径正常'}</span>
          <code title={view.dataDir}>{view.dataDir}</code>
        </footer>
      </WorkbenchMain>

      <AppEditorDialog open={editorOpen} onOpenChange={setEditorOpen} config={view.config} app={editingApp} onSave={saveConfig} />
      <ScanDialog open={scanOpen} onOpenChange={setScanOpen} config={view.config} onScan={actions.scanPaths} onSave={saveConfig} />
      <CategoryDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} config={view.config} onSave={saveConfig} />
      <UsageGuideDialog open={usageOpen} onOpenChange={setUsageOpen} />
      <DataToolsDialog
        open={dataToolsOpen}
        onOpenChange={setDataToolsOpen}
        config={view.config}
        view={view}
        backups={state.backups}
        onSave={saveConfig}
        onPreviewImport={actions.previewImport}
        onApplyImport={async (config) => { await actions.applyImport.mutateAsync(config) }}
        onExport={actions.exportConfig}
        onRestore={async (name) => { await actions.restoreBackup.mutateAsync(name) }}
        onRelocate={(oldRoot, newRoot) => actions.relocate.mutateAsync({ oldRoot, newRoot })}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="删除启动入口"
        description="只会从 AnyApp 配置中移除这条记录，不会删除磁盘上的软件或快捷方式。"
        detail={deleteTarget?.resolvedPath}
        confirmLabel="删除记录"
        danger
        busy={Boolean(deleteTarget && busyAppId === deleteTarget.id)}
        onConfirm={deleteApp}
      />
      <ConfirmDialog
        open={Boolean(websiteTarget)}
        onOpenChange={(open) => { if (!open) setWebsiteTarget(null) }}
        title="打开外部链接"
        description="链接将交给 Windows 默认浏览器打开。请先核对完整目标地址。"
        detail={websiteTarget?.website ?? undefined}
        confirmLabel="打开链接"
        busy={Boolean(websiteTarget && busyAppId === websiteTarget.id)}
        onConfirm={openWebsite}
      />
    </AnyAppShell>
  )
}

function LoadingScreen() {
  return (
    <main className="loading-shell" aria-label="AnyApp 正在加载">
      <span className="loading-symbol"><AppWindow /></span>
      <div><p>ANYAPP</p><span><Spinner />正在检查本地 JSON 与路径状态</span></div>
    </main>
  )
}

export default App

import { useEffect, useState } from 'react'
import { ArchiveRestore, ArrowRightLeft, Database, Download, FileJson, FolderSearch, Save, Settings2, TriangleAlert, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { pickDirectory, pickExportFile, pickImportFile } from '../lib/tauri-client'
import { displayDate, errorMessage } from '../lib/utils'
import type { AppConfig, BackupInfo, ConfigView, ImportPreview, RelocationResult } from '../types'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from './ui/sheet'
import { Spinner } from './ui/spinner'
import { Switch } from './ui/switch'
import { ConfirmDialog } from './ConfirmDialog'
import { SettingsBlock } from './workbench/SettingsBlock'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface DataToolsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: AppConfig
  view: ConfigView
  backups: BackupInfo[]
  onSave: (config: AppConfig) => Promise<void>
  onPreviewImport: (path: string) => Promise<ImportPreview>
  onApplyImport: (config: AppConfig) => Promise<void>
  onExport: (path: string) => Promise<void>
  onRestore: (name: string) => Promise<void>
  onRelocate: (oldRoot: string, newRoot: string) => Promise<RelocationResult>
}

export function DataToolsDialog({ open, onOpenChange, config, view, backups, onSave, onPreviewImport, onApplyImport, onExport, onRestore, onRelocate }: DataToolsDialogProps) {
  const [afterLaunch, setAfterLaunch] = useState(config.settings.afterLaunch)
  const [compactView, setCompactView] = useState(config.settings.compactView)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [importPath, setImportPath] = useState('')
  const [oldRoot, setOldRoot] = useState('')
  const [newRoot, setNewRoot] = useState('')
  const [restoreTarget, setRestoreTarget] = useState('')
  const [working, setWorking] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setAfterLaunch(config.settings.afterLaunch)
    setCompactView(config.settings.compactView)
    setPreview(null)
    setImportPath('')
    setOldRoot('')
    setNewRoot('')
    setRestoreTarget('')
    setWorking('')
    setStatus('')
    setError('')
  }, [config.settings.afterLaunch, config.settings.compactView, open])

  async function run(label: string, operation: () => Promise<string>) {
    setWorking(label)
    setError('')
    setStatus('')
    try {
      const message = await operation()
      setStatus(message)
      toast.success(message)
    } catch (cause) {
      const message = errorMessage(cause)
      setError(message)
      toast.error(message)
    } finally {
      setWorking('')
    }
  }

  function saveSettings() {
    return run('settings', async () => {
      await onSave({ ...config, settings: { afterLaunch, compactView } })
      return '启动行为与清单密度已保存'
    })
  }

  async function chooseImport() {
    const path = await pickImportFile()
    if (!path) return
    setImportPath(path)
    await run('preview', async () => {
      const result = await onPreviewImport(path)
      setPreview(result)
      return `已读取 ${result.sourceFormat}，请核对预览`
    })
  }

  function applyImport() {
    if (!preview) return
    return run('import', async () => {
      await onApplyImport(preview.config)
      setPreview(null)
      return '导入已应用，并已生成保存备份'
    })
  }

  async function exportConfig() {
    const path = await pickExportFile()
    if (!path) return
    await run('export', async () => {
      await onExport(path)
      return '当前配置已导出'
    })
  }

  function restoreBackup() {
    if (!restoreTarget) return
    const name = restoreTarget
    return run('restore', async () => {
      await onRestore(name)
      setRestoreTarget('')
      return `已恢复备份 ${name}`
    })
  }

  async function chooseOldRoot() {
    const path = await pickDirectory('选择失效路径原根目录')
    if (path) setOldRoot(path)
  }

  async function chooseNewRoot() {
    const path = await pickDirectory('选择软件迁移后的新根目录')
    if (path) setNewRoot(path)
  }

  function relocate() {
    if (!oldRoot || !newRoot) {
      setError('请先选择原根目录和新根目录')
      return
    }
    return run('relocate', async () => {
      const result = await onRelocate(oldRoot, newRoot)
      return `已重新定位 ${result.relocated} 项；仍有 ${result.stillMissing} 项路径异常`
    })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>数据与行为</SheetTitle>
            <SheetDescription>JSON 是唯一持久化事实来源。导入先预览，恢复与重新定位都需要明确操作。</SheetDescription>
          </SheetHeader>
          <SheetBody className="settings-sheet-body">
            <SettingsBlock
              actions={<Button disabled={Boolean(working)} size="sm" onClick={() => { void saveSettings() }}>{working === 'settings' ? <Spinner /> : <Save />}{working === 'settings' ? '保存中…' : '保存设置'}</Button>}
              description="控制程序启动后的窗口行为和清单密度。"
              icon={<Settings2 />}
              title="启动与显示"
            >
              <label className="settings-field-row">
                <span><strong>启动后窗口</strong><small>启动软件后保持、最小化或退出 AnyApp。</small></span>
                <Select value={afterLaunch} onValueChange={(value) => { if (value) setAfterLaunch(value as AppConfig['settings']['afterLaunch']) }}>
                  <SelectTrigger className="w-full"><SelectValue>{afterLaunch === 'minimize' ? '最小化' : afterLaunch === 'exit' ? '退出' : '保持'}</SelectValue></SelectTrigger>
                  <SelectContent><SelectItem value="keep">保持</SelectItem><SelectItem value="minimize">最小化</SelectItem><SelectItem value="exit">退出</SelectItem></SelectContent>
                </Select>
              </label>
              <label className="settings-field-row">
                <span><strong>紧凑清单</strong><small>缩短软件行，适合较大的软件库。</small></span>
                <Switch checked={compactView} onCheckedChange={setCompactView} />
              </label>
            </SettingsBlock>

            <SettingsBlock description="当前运行实例实际使用的位置。" icon={<Database />} title="数据位置">
              <PathLine label="数据目录" value={view.dataDir} />
              <PathLine label="配置文件" value={view.configPath} />
            </SettingsBlock>

            <SettingsBlock
              actions={<div className="settings-action-row"><Button disabled={Boolean(working)} size="sm" variant="secondary" onClick={() => { void chooseImport() }}>{working === 'preview' ? <Spinner /> : <Upload />}{working === 'preview' ? '读取中…' : '选择 JSON'}</Button><Button disabled={Boolean(working)} size="sm" variant="secondary" onClick={() => { void exportConfig() }}>{working === 'export' ? <Spinner /> : <Download />}{working === 'export' ? '导出中…' : '导出配置'}</Button></div>}
              description="兼容 schema v1、旧数组和旧对象格式。导入确认前不会写入。"
              icon={<FileJson />}
              title="导入与导出"
            >
              {importPath ? <PathLine label="导入来源" value={importPath} /> : <p className="settings-placeholder">尚未选择导入文件。</p>}
              {preview ? (
                <div className="import-preview">
                  <div><Badge variant="primary">{preview.sourceFormat}</Badge><span>{preview.appCount} 个软件 · {preview.categoryCount} 个分类</span></div>
                  {preview.warnings.length ? <details className="warning-details"><summary><TriangleAlert />{preview.warnings.length} 条迁移提示</summary><ul>{preview.warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul></details> : null}
                  <footer><Button size="sm" variant="ghost" onClick={() => setPreview(null)}>取消预览</Button><Button disabled={Boolean(working)} size="sm" onClick={() => { void applyImport() }}>{working === 'import' ? <Spinner /> : null}确认替换当前配置</Button></footer>
                </div>
              ) : null}
            </SettingsBlock>

            <SettingsBlock description="最多保留最近 3 份保存前配置。" icon={<ArchiveRestore />} title="轮换备份">
              <div className="backup-list">
                {backups.length === 0 ? <p className="settings-placeholder">尚未产生备份。</p> : null}
                {backups.map((backup) => (
                  <div className="backup-row" key={backup.name}>
                    <span><strong title={backup.name}>{backup.name}</strong><small>{displayDate(backup.modifiedAt)}</small></span>
                    <Badge variant={backup.valid ? 'success' : 'destructive'}>{backup.valid ? '有效' : '无效'}</Badge>
                    <Button disabled={!backup.valid || Boolean(working)} size="sm" variant="ghost" onClick={() => setRestoreTarget(backup.name)}>恢复</Button>
                  </div>
                ))}
              </div>
            </SettingsBlock>

            <SettingsBlock
              actions={<Button disabled={Boolean(working)} size="sm" variant="secondary" onClick={() => { void relocate() }}>{working === 'relocate' ? <Spinner /> : <ArrowRightLeft />}{working === 'relocate' ? '定位中…' : '开始重新定位'}</Button>}
              description="按相对后缀把失效绝对路径映射到新根目录。"
              icon={<ArrowRightLeft />}
              title="批量重新定位"
            >
              <DirectoryPicker label="原根目录" value={oldRoot} onChoose={() => { void chooseOldRoot() }} />
              <DirectoryPicker label="新根目录" value={newRoot} onChoose={() => { void chooseNewRoot() }} />
            </SettingsBlock>

            {status ? <p className="status-panel" role="status">{status}</p> : null}
            {error ? <p className="error-panel" role="alert">{error}</p> : null}
          </SheetBody>
          <SheetFooter><span className="settings-sheet-footnote">本地 JSON · 无远程同步 · 普通保存遇到损坏配置时失败关闭</span></SheetFooter>
        </SheetContent>
      </Sheet>
      <ConfirmDialog
        busy={working === 'restore'}
        confirmLabel="恢复备份"
        description="恢复会替换当前配置，并在替换前保留当前版本备份。"
        detail={restoreTarget || undefined}
        open={Boolean(restoreTarget)}
        title="确认恢复备份"
        onConfirm={restoreBackup}
        onOpenChange={(nextOpen) => { if (!nextOpen && working !== 'restore') setRestoreTarget('') }}
      />
    </>
  )
}

function PathLine({ label, value }: { label: string; value: string }) {
  return <div className="path-line"><span>{label}</span><code title={value}>{value}</code></div>
}

function DirectoryPicker({ label, value, onChoose }: { label: string; value: string; onChoose: () => void }) {
  return (
    <div className="directory-picker"><span>{label}</span><div><code title={value}>{value || '尚未选择'}</code><Button aria-label={`选择${label}`} size="icon-sm" title={`选择${label}`} variant="ghost" onClick={onChoose}><FolderSearch /></Button></div></div>
  )
}

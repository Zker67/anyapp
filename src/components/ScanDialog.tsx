import { useEffect, useState } from 'react'
import { FolderSearch, ScanSearch, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { pickScanRoots } from '../lib/tauri-client'
import { errorMessage, nowIso } from '../lib/utils'
import type { AppConfig, AppEntry, ScanCandidate, ScanResult } from '../types'
import { AppIcon } from './AppIcon'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Spinner } from './ui/spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface EditableCandidate extends ScanCandidate { selected: boolean }

interface ScanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: AppConfig
  onScan: (roots: string[]) => Promise<ScanResult>
  onSave: (config: AppConfig) => Promise<void>
}

export function ScanDialog({ open, onOpenChange, config, onScan, onSave }: ScanDialogProps) {
  const [roots, setRoots] = useState<string[]>([])
  const [candidates, setCandidates] = useState<EditableCandidate[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)

  useEffect(() => {
    if (!open) return
    setRoots([])
    setCandidates([])
    setWarnings([])
    setCategoryId(config.categories[0]?.id ?? '')
    setStatus('')
    setError('')
  }, [config.categories, open])

  async function chooseAndScan() {
    const selected = await pickScanRoots()
    if (!selected.length) return
    setRoots(selected)
    setWorking(true)
    setError('')
    setStatus('正在扫描；候选文件不会被执行。')
    try {
      const result = await onScan(selected)
      setCandidates(result.candidates.map((candidate) => ({ ...candidate, selected: true })))
      setWarnings(result.warnings)
      setStatus(`发现 ${result.candidates.length} 个候选；过滤 ${result.skippedFiltered} 个维护工具，跳过 ${result.skippedDuplicates} 个重复项。`)
    } catch (cause) {
      setError(errorMessage(cause))
      setStatus('')
    } finally {
      setWorking(false)
    }
  }

  async function apply() {
    const selected = candidates.filter((candidate) => candidate.selected)
    if (!selected.length) {
      setError('请至少选择一个候选项')
      return
    }
    setWorking(true)
    setError('')
    const now = nowIso()
    const additions: AppEntry[] = selected.map((candidate) => ({
      id: candidate.id,
      name: candidate.name.trim() || candidate.productName || candidate.path.split(/[\\/]/).pop() || '未命名软件',
      path: candidate.path,
      categoryId: categoryId || null,
      description: candidate.description,
      tags: [],
      favorite: false,
      website: null,
      iconKey: candidate.iconKey,
      createdAt: now,
      updatedAt: now,
      lastLaunchedAt: null,
      launchCount: 0,
    }))
    try {
      await onSave({ ...config, apps: [...config.apps, ...additions] })
      toast.success(`已导入 ${additions.length} 个软件`)
      onOpenChange(false)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setWorking(false)
    }
  }

  const selectedCount = candidates.filter((candidate) => candidate.selected).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(900px,calc(100vw-32px))]">
        <DialogHeader>
          <DialogTitle>扫描本地软件</DialogTitle>
          <DialogDescription>只枚举 .exe 和结构有效的 .lnk，不跟随链接或执行候选。关闭窗口不会改变正式配置。</DialogDescription>
        </DialogHeader>
        <DialogBody className="scan-dialog-body">
          <div className="scan-source-row">
            <Button disabled={working} onClick={() => { void chooseAndScan() }}>{working ? <Spinner /> : <FolderSearch />}{working ? '扫描中…' : '选择目录并扫描'}</Button>
            <div className="scan-root-list">{roots.map((root) => <Badge key={root} title={root} variant="outline">{root}</Badge>)}</div>
          </div>
          {status ? <p className="scan-status" role="status">{status}</p> : null}
          {warnings.length > 0 ? (
            <details className="warning-details">
              <summary><TriangleAlert />{warnings.length} 条扫描警告</summary>
              <ul>{warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul>
            </details>
          ) : null}
          {candidates.length > 0 ? (
            <>
              <div className="scan-batch-bar">
                <label><span>批量分类</span><Select value={categoryId || '__none__'} onValueChange={(value) => setCategoryId(value === '__none__' || !value ? '' : value)}><SelectTrigger className="min-w-48"><SelectValue>{config.categories.find((category) => category.id === categoryId)?.name ?? '未分类'}</SelectValue></SelectTrigger><SelectContent><SelectItem value="__none__">未分类</SelectItem>{config.categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select></label>
                <div><Button size="sm" variant="ghost" onClick={() => setCandidates((items) => items.map((item) => ({ ...item, selected: true })))}>全选</Button><Button size="sm" variant="ghost" onClick={() => setCandidates((items) => items.map((item) => ({ ...item, selected: false })))}>清空</Button></div>
              </div>
              <div className="scan-candidate-list">
                {candidates.map((candidate, index) => (
                  <label className="scan-candidate" key={candidate.id}>
                    <input checked={candidate.selected} type="checkbox" onChange={(event) => setCandidates((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, selected: event.target.checked } : item))} />
                    <AppIcon className="scan-candidate-icon" iconKey={candidate.iconKey} name={candidate.name} />
                    <span className="scan-candidate-copy">
                      <span><Input maxLength={200} value={candidate.name} onChange={(event) => setCandidates((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} /><Badge variant="neutral">{candidate.kind}</Badge></span>
                      <code title={candidate.path}>{candidate.path}</code>
                      {candidate.description ? <small>{candidate.description}</small> : null}
                    </span>
                  </label>
                ))}
              </div>
            </>
          ) : null}
          {!working && roots.length > 0 && candidates.length === 0 && !error ? <div className="scan-empty"><ScanSearch />没有可导入的新候选</div> : null}
          {error ? <p className="error-panel" role="alert">{error}</p> : null}
        </DialogBody>
        <DialogFooter className="scan-dialog-footer">
          <span>{candidates.length ? `已选择 ${selectedCount} / ${candidates.length}` : '选择目录后先预览候选'}</span>
          <div><Button variant="ghost" onClick={() => onOpenChange(false)}>取消</Button><Button disabled={working || selectedCount === 0} onClick={() => { void apply() }}>{working ? <Spinner /> : null}确认导入</Button></div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

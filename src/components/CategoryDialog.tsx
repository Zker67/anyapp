import { useEffect, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { errorMessage } from '../lib/utils'
import type { AppConfig, Category } from '../types'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Spinner } from './ui/spinner'
import { ConfirmDialog } from './ConfirmDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: AppConfig
  onSave: (config: AppConfig) => Promise<void>
}

const colors = ['cobalt', 'slate', 'teal', 'amber', 'rose'] as const
const colorLabels: Record<(typeof colors)[number], string> = { cobalt: '钴蓝', slate: '冷灰', teal: '青绿', amber: '琥珀', rose: '玫红' }

export function CategoryDialog({ open, onOpenChange, config, onSave }: CategoryDialogProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [removeTarget, setRemoveTarget] = useState<Category | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setCategories(config.categories.map((category) => ({ ...category })))
    setRemovedIds(new Set())
    setRemoveTarget(null)
    setError('')
  }, [config.categories, open])

  function addCategory() {
    if (categories.length >= 200) {
      setError('分类数量已达到 200 个上限')
      return
    }
    setCategories((items) => [...items, { id: `category-${crypto.randomUUID()}`, name: '新分类', color: 'cobalt' }])
  }

  function removeCategory() {
    if (!removeTarget) return
    setCategories((items) => items.filter((category) => category.id !== removeTarget.id))
    setRemovedIds((ids) => new Set(ids).add(removeTarget.id))
    setRemoveTarget(null)
  }

  async function saveCategories() {
    setError('')
    const normalized = categories.map((category) => ({ ...category, name: category.name.trim() }))
    if (normalized.some((category) => !category.name)) {
      setError('分类名称不能为空')
      return
    }
    const names = new Set(normalized.map((category) => category.name.toLocaleLowerCase('zh-CN')))
    if (names.size !== normalized.length) {
      setError('分类名称不能重复')
      return
    }
    setSaving(true)
    try {
      await onSave({
        ...config,
        categories: normalized,
        apps: config.apps.map((app) => app.categoryId && removedIds.has(app.categoryId) ? { ...app, categoryId: null } : app),
      })
      toast.success('分类已保存')
      onOpenChange(false)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setSaving(false)
    }
  }

  const removeCount = removeTarget ? config.apps.filter((app) => app.categoryId === removeTarget.id).length : 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>管理分类</DialogTitle>
            <DialogDescription>分类 ID 保持稳定。删除分类只会把其中的软件改为未分类，不会删除软件。</DialogDescription>
          </DialogHeader>
          <DialogBody className="category-dialog-body">
            <div className="category-list">
              {categories.map((category, index) => {
                const appCount = config.apps.filter((app) => app.categoryId === category.id).length
                return (
                  <div className="category-row" key={category.id}>
                    <span className={`category-color-dot category-color-${category.color}`} />
                    <Input aria-label={`分类 ${index + 1} 名称`} maxLength={100} value={category.name} onChange={(event) => setCategories((items) => items.map((item) => item.id === category.id ? { ...item, name: event.target.value } : item))} />
                    <Select value={category.color} onValueChange={(value) => { if (value) setCategories((items) => items.map((item) => item.id === category.id ? { ...item, color: value } : item)) }}>
                      <SelectTrigger aria-label={`${category.name} 颜色`} className="w-full"><SelectValue>{colorLabels[category.color as (typeof colors)[number]] ?? category.color}</SelectValue></SelectTrigger>
                      <SelectContent>{colors.map((color) => <SelectItem key={color} value={color}>{colorLabels[color]}</SelectItem>)}</SelectContent>
                    </Select>
                    <Badge variant="neutral">{appCount} 项</Badge>
                    <Button aria-label={`删除分类 ${category.name}`} size="icon-sm" title="删除分类" variant="ghost" onClick={() => setRemoveTarget(category)}><Trash2 /></Button>
                  </div>
                )
              })}
              {categories.length === 0 ? <div className="category-empty">当前没有分类；软件仍可保留在“未分类”。</div> : null}
            </div>
            {error ? <p className="error-panel" role="alert">{error}</p> : null}
          </DialogBody>
          <DialogFooter className="category-dialog-footer">
            <Button variant="secondary" onClick={addCategory}><Plus />新增分类</Button>
            <div><Button disabled={saving} variant="ghost" onClick={() => onOpenChange(false)}>取消</Button><Button disabled={saving} onClick={() => { void saveCategories() }}>{saving ? <Spinner /> : <Save />}{saving ? '保存中…' : '保存分类'}</Button></div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        danger
        busy={false}
        confirmLabel="删除分类"
        description={removeCount ? `其中 ${removeCount} 个软件会变为未分类，软件记录不会删除。` : '该分类当前没有软件，删除后无法撤销本次未保存修改。'}
        open={Boolean(removeTarget)}
        title={`删除“${removeTarget?.name ?? ''}”`}
        onConfirm={removeCategory}
        onOpenChange={(nextOpen) => { if (!nextOpen) setRemoveTarget(null) }}
      />
    </>
  )
}

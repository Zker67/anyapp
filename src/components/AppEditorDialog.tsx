import { useEffect, useRef, useState, type FormEvent } from 'react'
import { FolderSearch } from 'lucide-react'
import { toast } from 'sonner'
import { pickExecutable } from '../lib/tauri-client'
import { errorMessage, nowIso } from '../lib/utils'
import type { AppConfig, AppEntry } from '../types'
import { Button } from './ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Field } from './ui/field'
import { Input } from './ui/input'
import { Spinner } from './ui/spinner'
import { Switch } from './ui/switch'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface AppEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: AppConfig
  app: AppEntry | null
  onSave: (config: AppConfig) => Promise<void>
}

const emptyForm = { name: '', path: '', categoryId: '', description: '', tags: '', website: '', favorite: false }
type FormErrors = Partial<Record<'name' | 'path' | 'website' | 'form', string>>

export function AppEditorDialog({ open, onOpenChange, config, app, onSave }: AppEditorDialogProps) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const pathRef = useRef<HTMLInputElement>(null)
  const websiteRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(app ? {
      name: app.name,
      path: app.path,
      categoryId: app.categoryId ?? '',
      description: app.description,
      tags: app.tags.join(', '),
      website: app.website ?? '',
      favorite: app.favorite,
    } : { ...emptyForm, categoryId: config.categories[0]?.id ?? '' })
  }, [app, config.categories, open])

  async function choosePath() {
    const path = await pickExecutable()
    if (!path) return
    const fallbackName = path.split(/[\\/]/).pop()?.replace(/\.(exe|lnk)$/i, '') ?? ''
    setForm((current) => ({ ...current, path, name: current.name || fallbackName }))
    setErrors((current) => ({ ...current, path: undefined }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const nextErrors: FormErrors = {}
    if (!form.name.trim()) nextErrors.name = '请输入软件名称'
    if (!form.path.trim()) nextErrors.path = '请选择或输入启动路径'
    else if (!/\.(exe|lnk)$/i.test(form.path.trim())) nextErrors.path = '首版仅支持 .exe 和 .lnk'
    if (form.website && !/^https?:\/\//i.test(form.website.trim())) nextErrors.website = '外部链接必须以 http:// 或 https:// 开头'
    setErrors(nextErrors)
    if (nextErrors.name || nextErrors.path || nextErrors.website) {
      if (nextErrors.name) nameRef.current?.focus()
      else if (nextErrors.path) pathRef.current?.focus()
      else websiteRef.current?.focus()
      return
    }

    setSaving(true)
    const now = nowIso()
    const entry: AppEntry = {
      id: app?.id ?? `app-${crypto.randomUUID()}`,
      name: form.name.trim(),
      path: form.path.trim(),
      categoryId: form.categoryId || null,
      description: form.description.trim(),
      tags: form.tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
      favorite: form.favorite,
      website: form.website.trim() || null,
      iconKey: app?.iconKey ?? null,
      createdAt: app?.createdAt ?? now,
      updatedAt: now,
      lastLaunchedAt: app?.lastLaunchedAt ?? null,
      launchCount: app?.launchCount ?? 0,
    }
    const apps = app ? config.apps.map((item) => item.id === app.id ? entry : item) : [...config.apps, entry]
    try {
      await onSave({ ...config, apps })
      toast.success(app ? '软件信息已保存' : '软件已添加')
      onOpenChange(false)
    } catch (cause) {
      setErrors({ form: errorMessage(cause) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="contents" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{app ? '编辑启动入口' : '添加启动入口'}</DialogTitle>
            <DialogDescription>支持本地 .exe 或结构有效的 .lnk。相对路径以 AnyApp 可执行文件所在目录为基准。</DialogDescription>
          </DialogHeader>
          <DialogBody className="editor-form">
            <Field error={errors.name} label="名称" required>
              <Input ref={nameRef} aria-invalid={Boolean(errors.name)} autoFocus maxLength={200} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </Field>
            <Field error={errors.path} hint="可使用绝对路径，或相对于便携版 exe 的安全相对路径。" label="路径" required>
              <div className="field-action-row">
                <Input ref={pathRef} aria-invalid={Boolean(errors.path)} className="font-mono text-xs" value={form.path} onChange={(event) => setForm({ ...form, path: event.target.value })} />
                <Button type="button" variant="secondary" onClick={choosePath}><FolderSearch />选择</Button>
              </div>
            </Field>
            <div className="editor-form-columns">
              <Field label="分类">
                <Select value={form.categoryId || '__none__'} onValueChange={(value) => setForm({ ...form, categoryId: value === '__none__' || !value ? '' : value })}>
                  <SelectTrigger className="w-full"><SelectValue>{config.categories.find((category) => category.id === form.categoryId)?.name ?? '未分类'}</SelectValue></SelectTrigger>
                  <SelectContent><SelectItem value="__none__">未分类</SelectItem>{config.categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field hint="使用逗号分隔" label="标签">
                <Input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
              </Field>
            </div>
            <Field label="描述">
              <Textarea maxLength={2000} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </Field>
            <Field error={errors.website} hint="打开前会再次显示完整目标。" label="外部链接">
              <Input ref={websiteRef} aria-invalid={Boolean(errors.website)} placeholder="https://example.com" type="url" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} />
            </Field>
            <label className="switch-setting">
              <span><strong>收藏</strong><small>在清单与搜索结果中优先显示</small></span>
              <Switch checked={form.favorite} onCheckedChange={(favorite) => setForm({ ...form, favorite })} />
            </label>
            {errors.form ? <p className="error-panel" role="alert">{errors.form}</p> : null}
          </DialogBody>
          <DialogFooter>
            <Button disabled={saving} type="button" variant="ghost" onClick={() => onOpenChange(false)}>取消</Button>
            <Button disabled={saving} type="submit">{saving ? <Spinner /> : null}{saving ? '保存中…' : app ? '保存修改' : '保存软件'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

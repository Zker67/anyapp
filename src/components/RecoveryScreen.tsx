import { useState } from 'react'
import { ArchiveRestore, DatabaseZap, ShieldAlert } from 'lucide-react'
import { displayDate, errorMessage } from '../lib/utils'
import type { BackupInfo } from '../types'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Spinner } from './ui/spinner'
import { ConfirmDialog } from './ConfirmDialog'

interface RecoveryScreenProps {
  error: string | null
  backups: BackupInfo[]
  onRestore: (name: string) => Promise<void>
  onReset: () => Promise<void>
}

export function RecoveryScreen({ error, backups, onRestore, onReset }: RecoveryScreenProps) {
  const [busy, setBusy] = useState('')
  const [localError, setLocalError] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  async function restore(name: string) {
    setBusy(name)
    setLocalError('')
    try {
      await onRestore(name)
    } catch (cause) {
      setLocalError(errorMessage(cause))
    } finally {
      setBusy('')
    }
  }

  async function reset() {
    setBusy('reset')
    setLocalError('')
    try {
      await onReset()
    } catch (cause) {
      setLocalError(errorMessage(cause))
    } finally {
      setBusy('')
      setConfirmReset(false)
    }
  }

  return (
    <main className="recovery-shell">
      <section className="recovery-panel recovery-panel-wide">
        <span className="recovery-symbol"><ShieldAlert /></span>
        <p className="recovery-kicker">CONFIGURATION RECOVERY</p>
        <h1>配置需要恢复</h1>
        <p>当前 JSON 无法读取。AnyApp 已停止普通保存，避免覆盖可恢复数据。请选择有效备份，或先归档损坏文件后重置。</p>
        {error ? <pre className="error-panel">{error}</pre> : null}

        <div className="recovery-backups">
          <h2>可用备份</h2>
          {backups.length === 0 ? <div className="recovery-empty">没有找到轮换备份。</div> : null}
          {backups.map((backup) => (
            <div className="recovery-backup-row" key={backup.name}>
              <ArchiveRestore />
              <span><strong title={backup.name}>{backup.name}</strong><small>{displayDate(backup.modifiedAt)}</small></span>
              <Badge variant={backup.valid ? 'success' : 'destructive'}>{backup.valid ? '可恢复' : '无效'}</Badge>
              <Button disabled={!backup.valid || Boolean(busy)} size="sm" variant="secondary" onClick={() => { void restore(backup.name) }}>{busy === backup.name ? <Spinner /> : null}{busy === backup.name ? '恢复中…' : '恢复'}</Button>
            </div>
          ))}
        </div>

        <div className="recovery-danger-zone">
          <DatabaseZap />
          <span><strong>重置为空配置</strong><small>损坏文件会先另存归档；备份不会被删除。</small></span>
          <Button disabled={Boolean(busy)} size="sm" variant="destructive" onClick={() => setConfirmReset(true)}>准备重置</Button>
        </div>
        {localError ? <p className="error-panel" role="alert">{localError}</p> : null}
      </section>
      <ConfirmDialog
        danger
        busy={busy === 'reset'}
        confirmLabel="归档并重置"
        description="当前损坏配置会先归档为空间内的 corrupt 文件，然后创建新的空配置。此操作不会自动迁移当前清单。"
        open={confirmReset}
        title="确认重置配置"
        onConfirm={reset}
        onOpenChange={(nextOpen) => { if (!nextOpen && busy !== 'reset') setConfirmReset(false) }}
      />
    </main>
  )
}

import { TriangleAlert } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { Spinner } from './ui/spinner'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  detail?: string
  confirmLabel: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({ open, onOpenChange, title, description, detail, confirmLabel, danger, busy, onConfirm }: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <span className={danger ? 'confirm-dialog-icon confirm-dialog-icon-danger' : 'confirm-dialog-icon'}><TriangleAlert /></span>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {detail ? <p className="confirm-dialog-detail" title={detail}>{detail}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>取消</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={() => { void onConfirm() }} variant={danger ? 'destructive' : 'default'}>
            {busy ? <Spinner /> : null}{busy ? '处理中…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

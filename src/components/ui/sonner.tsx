import { CircleCheck, Info, LoaderCircle, OctagonX, TriangleAlert } from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      data-slot="sonner"
      icons={{ success: <CircleCheck className="size-4" />, info: <Info className="size-4" />, warning: <TriangleAlert className="size-4" />, error: <OctagonX className="size-4" />, loading: <LoaderCircle className="size-4 animate-spin" /> }}
      position="top-center"
      theme="dark"
      toastOptions={{ classNames: { toast: 'anyapp-toast' } }}
      {...props}
    />
  )
}

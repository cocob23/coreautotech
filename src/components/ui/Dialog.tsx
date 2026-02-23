import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '../../utils/cn'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export const DialogPortal = DialogPrimitive.Portal

export function DialogContent({ className, ...props }: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPrimitive.Content
      className={cn('fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-neutral-950 p-6 shadow-xl', className)}
      {...props}
    />
  )
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 text-lg font-semibold">{children}</div>
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex justify-end gap-2">{children}</div>
}

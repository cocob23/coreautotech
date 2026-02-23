import * as React from 'react'
import { cn } from '../../utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn('flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-ring', className)}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

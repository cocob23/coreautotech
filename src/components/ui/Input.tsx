import * as React from 'react'
import { cn } from '../../utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn('flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-ring', className)}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

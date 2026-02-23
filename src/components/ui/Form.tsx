import * as React from 'react'
import { cn } from '../../utils/cn'

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn('block text-sm font-medium', className)}>{children}</label>
}

export function Field({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('space-y-1', className)}>{children}</div>
}

import { cn } from '../../utils/cn'

export function Badge({ children, className, variant = 'default' }: { children: React.ReactNode; className?: string; variant?: 'default' | 'secondary' }) {
  const styles =
    variant === 'secondary'
      ? 'bg-neutral-800 text-white'
      : 'bg-brand text-brand-foreground'
  return <span className={cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', styles, className)}>{children}</span>
}

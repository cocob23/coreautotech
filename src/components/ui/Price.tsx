import { cn } from '../../utils/cn'

export function formatPriceParts(amount: number): { integer: string; cents: string } {
  const normalized = Number.isFinite(amount) ? amount : 0
  const fixed = normalized.toFixed(2)
  const [integerRaw, cents] = fixed.split('.')
  const integer = Number(integerRaw).toLocaleString('es-AR')
  return { integer, cents }
}

type PriceProps = {
  amount: number
  className?: string
  integerClassName?: string
  centsClassName?: string
  currencyClassName?: string
}

export function Price({ amount, className, integerClassName, centsClassName, currencyClassName }: PriceProps) {
  const parts = formatPriceParts(amount)

  return (
    <span className={cn('inline-flex items-start whitespace-nowrap tabular-nums leading-none', className)}>
      <span className={cn('block leading-none tracking-tight', integerClassName, currencyClassName)}>{`$${parts.integer}`}</span>
      <span className={cn('ml-[0.22em] mt-[0.18rem] text-[0.46em] leading-none', centsClassName)}>
        {parts.cents}
      </span>
    </span>
  )
}

'use client'

import { useCurrency } from '@/lib/hooks/useCurrency'
import { formatCurrency } from '@/lib/utils/formatters'
import type { Database } from '@/types/supabase'

type Currency = Database['public']['Enums']['currency_code']

interface AmountProps {
  value: number
  currency?: Currency
  className?: string
}

export function Amount({ value, currency: explicitCurrency, className }: AmountProps) {
  const { currency: contextCurrency } = useCurrency()
  const currency = explicitCurrency || contextCurrency

  return (
    <span className={className}>
      {formatCurrency(value, currency)}
    </span>
  )
}

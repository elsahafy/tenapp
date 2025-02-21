'use client'

import { useCurrency } from '@/lib/hooks/useCurrency'
import { formatCurrency } from '@/lib/utils/formatters'
import { convertCurrency, updateExchangeRates } from '@/lib/utils/currencyConverter'
import type { Database } from '@/types/supabase'
import clsx from 'clsx'
import { useEffect } from 'react'

type Currency = Database['public']['Enums']['currency_code']

interface AmountProps {
  value: number
  currency?: Currency
  className?: string
  accountType?: Database['public']['Enums']['account_type']
}

export function Amount({ value, currency: explicitCurrency, className, accountType }: AmountProps) {
  const { currency: contextCurrency } = useCurrency()
  const targetCurrency = explicitCurrency || contextCurrency

  // For loans and credit cards, we want to show the balance in red and as negative since it represents money owed
  const isDebtAccount = accountType === 'loan' || accountType === 'credit_card'
  const displayValue = isDebtAccount ? -Math.abs(value) : value
  const shouldShowRed = isDebtAccount || displayValue < 0

  console.log('Amount component:', { accountType, value, shouldShowRed })

  // Ensure exchange rates are up to date
  useEffect(() => {
    updateExchangeRates()
  }, [])

  // Convert the amount if currencies are different
  const convertedValue = explicitCurrency && explicitCurrency !== targetCurrency
    ? convertCurrency(displayValue, explicitCurrency, targetCurrency)
    : displayValue

  return (
    <span 
      className={clsx(
        'text-sm',
        {
          'text-red-600': shouldShowRed,
          'text-gray-900': !shouldShowRed
        },
        className
      )}
    >
      {formatCurrency(convertedValue, targetCurrency)}
    </span>
  )
}

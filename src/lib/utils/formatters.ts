import { Database } from '@/types/supabase'

type Currency = Database['public']['Enums']['currency_code']

export function formatCurrency(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

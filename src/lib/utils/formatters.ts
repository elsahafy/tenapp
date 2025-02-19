import { Database } from '@/types/supabase'

type Currency = Database['public']['Enums']['currency_code']

const CURRENCY_LOCALES: Record<Currency, string> = {
  'USD': 'en-US',
  'EUR': 'en-US',
  'GBP': 'en-US',
  'AED': 'en-US',
  'SAR': 'en-US',
  'QAR': 'en-US',
  'BHD': 'en-US',
  'KWD': 'en-US',
  'OMR': 'en-US',
  'EGP': 'en-US'
}

export function formatCurrency(amount: number, currency: Currency): string {
  const locale = 'en-US'
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    currencyDisplay: 'narrowSymbol'
  }

  // Special handling for currencies with 3 decimal places
  if (['BHD', 'KWD', 'OMR'].includes(currency)) {
    options.minimumFractionDigits = 3
    options.maximumFractionDigits = 3
  }

  return new Intl.NumberFormat(locale, options).format(amount)
}

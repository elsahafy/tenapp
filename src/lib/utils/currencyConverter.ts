import type { Database } from '@/types/supabase'
import { getLatestExchangeRates } from './exchangeRates'

type CurrencyCode = Database['public']['Enums']['currency_code']

// Fallback exchange rates in case API fails
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.925,
  GBP: 0.792,
  AED: 3.6725,
  SAR: 3.75,
  QAR: 3.64,
  BHD: 0.376,
  KWD: 0.308,
  OMR: 0.385,
  EGP: 46.25
}

let currentRates = { ...FALLBACK_RATES }
let lastUpdate = 0

export async function updateExchangeRates(): Promise<void> {
  try {
    const now = Date.now()
    // Update rates if more than 1 hour old
    if (now - lastUpdate > 3600000) {
      const newRates = await getLatestExchangeRates()
      currentRates = newRates
      lastUpdate = now
    }
  } catch (error) {
    console.error('Error updating exchange rates:', error)
    // Keep using current rates if update fails
  }
}

export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): number {
  // If currencies are the same, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount
  }

  // Use current rates (which will be updated periodically)
  const rates = currentRates

  // Convert to USD first (as base currency)
  const amountInUSD = amount / rates[fromCurrency]
  
  // Convert from USD to target currency
  const convertedAmount = amountInUSD * rates[toCurrency]
  
  // Round to 2 decimal places
  return Math.round(convertedAmount * 100) / 100
}

export function formatCurrencyWithCode(amount: number, currency: CurrencyCode): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return formatter.format(amount)
}

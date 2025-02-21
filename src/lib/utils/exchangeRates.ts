import type { Database } from '@/types/supabase'

type CurrencyCode = Database['public']['Enums']['currency_code']

interface ExchangeRateResponse {
  result: string
  documentation: string
  terms_of_use: string
  time_last_update_unix: number
  time_last_update_utc: string
  time_next_update_unix: number
  time_next_update_utc: string
  base_code: string
  rates: Record<string, number>
}

interface CachedRates {
  rates: Record<CurrencyCode, number>
  lastUpdated: string
}

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

const CACHE_KEY = 'exchange_rates_cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

async function fetchExchangeRatesFromAPI(): Promise<Record<CurrencyCode, number>> {
  try {
    // Free API from exchangerate-api.com
    const response = await fetch('https://open.er-api.com/v6/latest/USD')
    const data: ExchangeRateResponse = await response.json()

    // Filter only the currencies we support
    return {
      USD: 1,
      EUR: data.rates.EUR || FALLBACK_RATES.EUR,
      GBP: data.rates.GBP || FALLBACK_RATES.GBP,
      AED: data.rates.AED || FALLBACK_RATES.AED,
      SAR: data.rates.SAR || FALLBACK_RATES.SAR,
      QAR: data.rates.QAR || FALLBACK_RATES.QAR,
      BHD: data.rates.BHD || FALLBACK_RATES.BHD,
      KWD: data.rates.KWD || FALLBACK_RATES.KWD,
      OMR: data.rates.OMR || FALLBACK_RATES.OMR,
      EGP: data.rates.EGP || FALLBACK_RATES.EGP
    }
  } catch (error) {
    console.error('Error fetching exchange rates from API:', error)
    return FALLBACK_RATES
  }
}

function getCachedRates(): CachedRates | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const parsedCache = JSON.parse(cached) as CachedRates
    return parsedCache
  } catch (error) {
    console.error('Error reading cached exchange rates:', error)
    return null
  }
}

function setCachedRates(rates: Record<CurrencyCode, number>): void {
  try {
    const cache: CachedRates = {
      rates,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('Error caching exchange rates:', error)
  }
}

export async function getLatestExchangeRates(): Promise<Record<CurrencyCode, number>> {
  try {
    // Try to get rates from cache first
    const cached = getCachedRates()
    
    if (cached) {
      const lastUpdate = new Date(cached.lastUpdated)
      const now = new Date()
      const timeSinceUpdate = now.getTime() - lastUpdate.getTime()

      // Use cached rates if they're less than 24 hours old
      if (timeSinceUpdate < CACHE_DURATION) {
        return cached.rates
      }
    }

    // If no cache or cache is old, fetch new rates
    console.log('Fetching fresh exchange rates from API...')
    const rates = await fetchExchangeRatesFromAPI()
    
    // Cache the new rates
    setCachedRates(rates)
    
    return rates
  } catch (error) {
    console.error('Error in getLatestExchangeRates:', error)
    return FALLBACK_RATES
  }
}

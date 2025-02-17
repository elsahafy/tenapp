interface ExchangeRateResponse {
  success: boolean
  timestamp: number
  base: string
  date: string
  rates: { [key: string]: number }
}

const EXCHANGE_RATE_API_URL = 'https://api.exchangerate.host'

export async function fetchExchangeRates(
  baseCurrency: string
): Promise<{ [key: string]: number }> {
  try {
    const response = await fetch(
      `${EXCHANGE_RATE_API_URL}/latest?base=${baseCurrency}`
    )
    const data: ExchangeRateResponse = await response.json()

    if (!data.success) {
      throw new Error('Failed to fetch exchange rates')
    }

    return data.rates
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    throw error
  }
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: { [key: string]: number }
): number {
  if (fromCurrency === toCurrency) {
    return amount
  }

  const rate = rates[toCurrency]
  if (!rate) {
    throw new Error(`Exchange rate not found for ${toCurrency}`)
  }

  return amount * rate
}

// Cache exchange rates for 1 hour
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds
let cachedRates: {
  timestamp: number
  base: string
  rates: { [key: string]: number }
} | null = null

export async function getExchangeRates(
  baseCurrency: string
): Promise<{ [key: string]: number }> {
  const now = Date.now()

  // Return cached rates if they're still valid
  if (
    cachedRates &&
    cachedRates.base === baseCurrency &&
    now - cachedRates.timestamp < CACHE_DURATION
  ) {
    return cachedRates.rates
  }

  // Fetch new rates
  const rates = await fetchExchangeRates(baseCurrency)
  cachedRates = {
    timestamp: now,
    base: baseCurrency,
    rates,
  }

  return rates
}

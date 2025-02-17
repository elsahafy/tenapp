export interface Currency {
  code: string
  name: string
  symbol: string
  decimal_digits: number
  rounding: number
  symbol_native: string
  name_plural: string
}

export const currencies: { [key: string]: Currency } = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimal_digits: 2,
    rounding: 0,
    symbol_native: '$',
    name_plural: 'US dollars',
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimal_digits: 2,
    rounding: 0,
    symbol_native: '€',
    name_plural: 'euros',
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimal_digits: 2,
    rounding: 0,
    symbol_native: '£',
    name_plural: 'British pounds',
  },
  AED: {
    code: 'AED',
    name: 'United Arab Emirates Dirham',
    symbol: 'AED',
    decimal_digits: 2,
    rounding: 0,
    symbol_native: 'د.إ',
    name_plural: 'UAE dirhams',
  },
  SAR: {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'SR',
    decimal_digits: 2,
    rounding: 0,
    symbol_native: 'ر.س',
    name_plural: 'Saudi riyals',
  },
  QAR: {
    code: 'QAR',
    name: 'Qatari Rial',
    symbol: 'QR',
    decimal_digits: 2,
    rounding: 0,
    symbol_native: 'ر.ق',
    name_plural: 'Qatari rials',
  },
  KWD: {
    code: 'KWD',
    name: 'Kuwaiti Dinar',
    symbol: 'KD',
    decimal_digits: 3,
    rounding: 0,
    symbol_native: 'د.ك',
    name_plural: 'Kuwaiti dinars',
  },
  BHD: {
    code: 'BHD',
    name: 'Bahraini Dinar',
    symbol: 'BD',
    decimal_digits: 3,
    rounding: 0,
    symbol_native: 'د.ب',
    name_plural: 'Bahraini dinars',
  },
  OMR: {
    code: 'OMR',
    name: 'Omani Rial',
    symbol: 'OR',
    decimal_digits: 3,
    rounding: 0,
    symbol_native: 'ر.ع',
    name_plural: 'Omani rials',
  },
}

export function formatCurrency(
  amount: number,
  currencyCode: string,
  options: {
    showSymbol?: boolean
    useNativeSymbol?: boolean
    showCode?: boolean
  } = {}
): string {
  const currency = currencies[currencyCode]
  if (!currency) {
    throw new Error(`Unsupported currency code: ${currencyCode}`)
  }

  const {
    showSymbol = true,
    useNativeSymbol = false,
    showCode = false,
  } = options

  const symbol = useNativeSymbol ? currency.symbol_native : currency.symbol
  const formattedAmount = amount.toLocaleString(undefined, {
    minimumFractionDigits: currency.decimal_digits,
    maximumFractionDigits: currency.decimal_digits,
  })

  let result = ''
  if (showSymbol) {
    result += symbol + ' '
  }
  result += formattedAmount
  if (showCode) {
    result += ` ${currency.code}`
  }

  return result
}

export function getCurrencySymbol(
  currencyCode: string,
  useNativeSymbol = false
): string {
  const currency = currencies[currencyCode]
  if (!currency) {
    throw new Error(`Unsupported currency code: ${currencyCode}`)
  }
  return useNativeSymbol ? currency.symbol_native : currency.symbol
}

export function validateCurrencyCode(code: string): boolean {
  return code in currencies
}

export const defaultCurrency = 'USD'

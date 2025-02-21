import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Validate that the request is authorized
const validateRequest = (req: NextApiRequest): boolean => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }
  // Compare with environment variable CRON_SECRET
  const token = authHeader.split(' ')[1]
  return token === process.env.CRON_SECRET
}

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Validate the request
  if (!validateRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch exchange rates from API
    const response = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data: ExchangeRateResponse = await response.json()

    // Filter only the currencies we support
    const supportedRates = {
      USD: 1,
      EUR: data.rates.EUR,
      GBP: data.rates.GBP,
      AED: data.rates.AED,
      SAR: data.rates.SAR,
      QAR: data.rates.QAR,
      BHD: data.rates.BHD,
      KWD: data.rates.KWD,
      OMR: data.rates.OMR,
      EGP: data.rates.EGP
    }

    // Store in Supabase
    const { error } = await supabase
      .from('exchange_rates')
      .insert({
        base_currency: 'USD',
        rates: supportedRates,
        last_updated: new Date(data.time_last_update_unix * 1000).toISOString(),
        next_update: new Date(data.time_next_update_unix * 1000).toISOString()
      })

    if (error) {
      throw new Error(`Failed to store exchange rates: ${error.message}`)
    }

    return res.status(200).json({ success: true, rates: supportedRates })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error updating exchange rates:', errorMessage)
    return res.status(500).json({ error: errorMessage })
  }
}

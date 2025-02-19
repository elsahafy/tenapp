import type { Database } from '@/types/supabase'
import { supabase } from '@/lib/supabase-client'

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

// Create a table to store exchange rates
export async function createExchangeRatesTable() {
  const { error } = await supabase.rpc('create_exchange_rates_table', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.exchange_rates (
        id SERIAL PRIMARY KEY,
        base_currency currency_code NOT NULL,
        rates JSONB NOT NULL,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        next_update TIMESTAMP WITH TIME ZONE
      );

      -- Add policy to allow all authenticated users to read exchange rates
      CREATE POLICY "Allow all users to read exchange rates"
        ON public.exchange_rates
        FOR SELECT
        USING (true);
    `
  })
  
  if (error) {
    console.error('Error creating exchange rates table:', error)
    throw error
  }
}

export async function fetchAndStoreExchangeRates() {
  try {
    // Free API from exchangerate-api.com
    const response = await fetch('https://open.er-api.com/v6/latest/USD')
    const data: ExchangeRateResponse = await response.json()

    // Filter only the currencies we support
    const supportedRates: Record<CurrencyCode, number> = {
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
      .upsert({
        base_currency: 'USD',
        rates: supportedRates,
        last_updated: new Date(data.time_last_update_unix * 1000).toISOString(),
        next_update: new Date(data.time_next_update_unix * 1000).toISOString()
      })

    if (error) throw error

    return supportedRates
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    throw error
  }
}

export async function getLatestExchangeRates(): Promise<Record<CurrencyCode, number>> {
  try {
    // Try to get rates from Supabase first
    const { data: ratesData, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error

    // If rates exist and are less than 24 hours old, use them
    if (ratesData && ratesData.last_updated) {
      const lastUpdate = new Date(ratesData.last_updated)
      const now = new Date()
      const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60)

      if (hoursSinceUpdate < 24) {
        return ratesData.rates
      }
    }

    // If rates don't exist or are old, fetch new ones
    return await fetchAndStoreExchangeRates()
  } catch (error) {
    console.error('Error getting exchange rates:', error)
    throw error
  }
}

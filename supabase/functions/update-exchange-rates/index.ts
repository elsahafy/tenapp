import { serve } from 'std/http/server.ts'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface RequestEvent {
  request: Request
  url: URL
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

interface SupportedRates {
  USD: number
  EUR: number
  GBP: number
  AED: number
  SAR: number
  QAR: number
  BHD: number
  KWD: number
  OMR: number
  EGP: number
}

async function updateExchangeRates(supabaseClient: SupabaseClient): Promise<SupportedRates> {
  const response = await fetch('https://open.er-api.com/v6/latest/USD')
  if (!response.ok) {
    throw new Error(`API responded with status: ${response.status}`)
  }

  const data: ExchangeRateResponse = await response.json()

  // Filter only the currencies we support
  const supportedRates: SupportedRates = {
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
  const { error } = await supabaseClient
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

  return supportedRates
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey)
    const rates = await updateExchangeRates(supabaseClient)

    return new Response(
      JSON.stringify({ success: true, rates }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

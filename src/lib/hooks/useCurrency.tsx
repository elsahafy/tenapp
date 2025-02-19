'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from './useUser'
import type { Database } from '@/types/supabase'

type Currency = Database['public']['Enums']['currency_code']

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => Promise<void>
  loading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const [currency, setCurrencyState] = useState<Currency>('USD')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadPreferredCurrency()
    }
  }, [user])

  const loadPreferredCurrency = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_currency')
        .eq('id', user.id)
        .single()

      if (error) throw error
      if (data?.preferred_currency) {
        setCurrencyState(data.preferred_currency)
      }
    } catch (error) {
      console.error('Error loading preferred currency:', error)
    } finally {
      setLoading(false)
    }
  }

  const setCurrency = async (newCurrency: Currency) => {
    if (!user) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('profiles')
        .update({ preferred_currency: newCurrency })
        .eq('id', user.id)

      if (error) throw error
      setCurrencyState(newCurrency)
    } catch (error) {
      console.error('Error updating preferred currency:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, loading }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SUPPORTED_CURRENCIES } from '@/types'
import { User } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

type Currency = Database['public']['Enums']['currency_code']

interface CurrencySelectorProps {
  onChange: (currency: Currency) => void
}

export function CurrencySelector({ onChange }: CurrencySelectorProps) {
  const [currency, setCurrency] = useState<Currency>('USD')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error loading user:', error)
      }
    }

    loadUser()
  }, [])

  useEffect(() => {
    async function loadPreferredCurrency() {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('preferred_currency')
          .eq('id', user.id)
          .single()

        if (error) throw error
        if (data?.preferred_currency) {
          setCurrency(data.preferred_currency)
          onChange(data.preferred_currency)
        }
      } catch (error) {
        console.error('Error loading preferred currency:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPreferredCurrency()
  }, [user, onChange])

  const handleCurrencyChange = async (newCurrency: Currency) => {
    if (!user) return

    try {
      setCurrency(newCurrency)
      onChange(newCurrency)

      const { error } = await supabase
        .from('profiles')
        .update({ preferred_currency: newCurrency })
        .eq('id', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating preferred currency:', error)
    }
  }

  if (loading) return null

  return (
    <select
      value={currency}
      onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
    >
      {Object.entries(SUPPORTED_CURRENCIES).map(([code, name]) => (
        <option key={code} value={code}>
          {code} - {name}
        </option>
      ))}
    </select>
  )
}

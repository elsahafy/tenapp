'use client'

import { useEffect, useState } from 'react'
import { SUPPORTED_CURRENCIES } from '@/types'
import { Database } from '@/types/supabase'
import { useCurrency } from '@/lib/hooks/useCurrency'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-radix"

type Currency = Database['public']['Enums']['currency_code']

interface CurrencySelectorProps {
  onChange?: (currency: Currency) => void
  className?: string
}

export function CurrencySelector({ onChange, className }: CurrencySelectorProps) {
  const { currency, setCurrency, loading } = useCurrency()

  const handleChange = async (newCurrency: Currency) => {
    try {
      await setCurrency(newCurrency)
      onChange?.(newCurrency)
    } catch (error) {
      console.error('Error updating currency:', error)
    }
  }

  return (
    <Select
      disabled={loading}
      value={currency}
      onValueChange={handleChange}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(SUPPORTED_CURRENCIES).map(([code, name]) => (
          <SelectItem key={code} value={code as Currency}>
            {code} - {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

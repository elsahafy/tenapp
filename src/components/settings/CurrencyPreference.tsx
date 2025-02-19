'use client'

import { useState } from 'react'
import type { Database } from '@/types/supabase'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'

type CurrencyCode = Database['public']['Enums']['currency_code']

const CURRENCY_OPTIONS: { value: CurrencyCode; label: string }[] = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'AED', label: 'UAE Dirham (AED)' },
  { value: 'SAR', label: 'Saudi Riyal (SAR)' },
  { value: 'QAR', label: 'Qatari Riyal (QAR)' },
  { value: 'BHD', label: 'Bahraini Dinar (BHD)' },
  { value: 'KWD', label: 'Kuwaiti Dinar (KWD)' },
  { value: 'OMR', label: 'Omani Rial (OMR)' },
  { value: 'EGP', label: 'Egyptian Pound (EGP)' }
]

export function CurrencyPreference() {
  const { preferences, updatePreferredCurrency } = useUserPreferences()
  const [saving, setSaving] = useState(false)

  const handleCurrencyChange = async (currency: CurrencyCode) => {
    setSaving(true)
    try {
      await updatePreferredCurrency(currency)
    } catch (error) {
      console.error('Error updating currency preference:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          Preferred Currency
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>
            Choose your preferred currency. All account balances will be converted to this currency
            in summaries and reports.
          </p>
        </div>
        <div className="mt-5">
          <select
            id="currency"
            name="currency"
            className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm sm:leading-6"
            value={preferences.preferredCurrency}
            onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
            disabled={saving}
          >
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

'use client'

import { CurrencyPreference } from '@/components/settings/CurrencyPreference'

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        
        <div className="mt-6 space-y-6">
          <CurrencyPreference />
          {/* Add other settings sections here */}
        </div>
      </div>
    </div>
  )
}

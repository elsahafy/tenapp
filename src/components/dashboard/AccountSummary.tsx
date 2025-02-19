'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import type { Database } from '@/types/supabase'
import { Amount } from '@/components/ui/amount'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { formatCurrencyWithCode, convertCurrency } from '@/lib/utils/currencyConverter'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row']

export function AccountSummary() {
  const { preferences, loading: prefsLoading } = useUserPreferences()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const { data: accountsData, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (error) throw error

        const fetchedAccounts = accountsData || []
        setAccounts(fetchedAccounts)

        // Only calculate total balance if we have preferences and accounts
        if (!prefsLoading && preferences.preferredCurrency) {
          const total = fetchedAccounts.reduce((sum, account) => {
            // Convert the balance to the preferred currency
            const convertedBalance = convertCurrency(
              account.current_balance,
              account.currency,
              preferences.preferredCurrency
            )
            
            // For credit cards, subtract the balance since it represents debt
            if (account.type === 'credit_card') {
              return sum - convertedBalance
            }
            
            return sum + convertedBalance
          }, 0)
          setTotalBalance(total)
        }
      } catch (error) {
        console.error('Error fetching accounts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [prefsLoading, preferences.preferredCurrency])

  // Show loading state while fetching accounts or preferences
  if (loading || prefsLoading) {
    return (
      <Card className="relative overflow-hidden bg-white shadow-sm border border-gray-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">Account Summary</CardTitle>
            <p className="text-sm text-gray-500">Overview of your financial accounts</p>
          </div>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden bg-white shadow-sm border border-gray-100">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">Account Summary</CardTitle>
          <p className="text-sm text-gray-500">Overview of your financial accounts</p>
        </div>
        <div className="text-lg font-medium">
          {preferences.preferredCurrency && (
            <>Total Balance: {formatCurrencyWithCode(totalBalance, preferences.preferredCurrency)}</>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accounts.length > 0 ? (
            <>
              {accounts.map((account) => {
                if (!preferences.preferredCurrency) return null
                
                const convertedBalance = convertCurrency(
                  account.current_balance,
                  account.currency,
                  preferences.preferredCurrency
                )

                return (
                  <div
                    key={account.id}
                    className={cn(
                      'group flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100',
                      'transition-all duration-200 hover:shadow-sm hover:border-blue-100'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <svg
                          className="h-5 w-5 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{account.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {account.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-medium",
                        account.type === 'credit_card' ? 'text-red-600' : 'text-gray-900'
                      )}>
                        {account.type === 'credit_card' ? '-' : ''}
                        {formatCurrencyWithCode(convertedBalance, preferences.preferredCurrency)}
                      </p>
                      {account.currency !== preferences.preferredCurrency && (
                        <p className="mt-1 text-sm text-gray-500">
                          {account.type === 'credit_card' ? '-' : ''}
                          {formatCurrencyWithCode(account.current_balance, account.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-gray-500">No accounts found</p>
              <Link href="/accounts" className="mt-2">
                <Button variant="link">Add an account</Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

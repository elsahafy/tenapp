'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'
import { Amount } from '@/components/ui/amount'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { formatCurrencyWithCode, convertCurrency } from '@/lib/utils/currencyConverter'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'
import { Tooltip } from '@/components/ui/Tooltip'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row']

const accountTypeDescriptions = {
  checking: 'A standard bank account for everyday transactions',
  savings: 'An interest-bearing account for saving money',
  credit_card: 'A revolving credit line - negative balance indicates amount owed',
  loan: 'A borrowed amount to be repaid over time - negative balance indicates remaining debt',
  investment: 'An account holding stocks, bonds, or other investments',
  cash: 'Physical money held in cash'
} as const

export function AccountSummary() {
  const { preferences, loading: prefsLoading } = useUserPreferences()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const { data: accounts, error } = await supabase
          .from('accounts')
          .select('*')
          .order('name')

        if (error) throw error

        setAccounts(accounts || [])
      } catch (error) {
        console.error('Error fetching accounts:', error)
        setError('Failed to load accounts')
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [])

  // Calculate total balance
  const totalBalance = accounts.reduce((sum, account) => {
    const balance = Number(account.current_balance)
    // For credit cards and loans, the balance is already negative in the database
    const convertedBalance = convertCurrency(
      balance,
      account.currency,
      preferences.preferredCurrency
    )
    return sum + convertedBalance
  }, 0)

  // Show loading state while fetching accounts or preferences
  if (loading || prefsLoading) {
    return (
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Account Summary</h3>
            <div className="mt-4 sm:mt-0">
              <p className="text-sm text-gray-500">
                Total Balance:{' '}
                <span className={cn(
                  "font-medium",
                  totalBalance < 0 ? 'text-red-600' : 'text-gray-900'
                )}>
                  {formatCurrencyWithCode(totalBalance, preferences.preferredCurrency)}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-6 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <div className="min-w-full divide-y divide-gray-300">
                    {/* Account list */}
                    <div className="bg-white">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="animate-pulse flex space-x-4">
                          <div className="flex-1 space-y-4 py-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded"></div>
                              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Account Summary</h3>
          <div className="mt-4 sm:mt-0">
            <p className="text-sm text-gray-500">
              Total Balance:{' '}
              <span className={cn(
                "font-medium",
                totalBalance < 0 ? 'text-red-600' : 'text-gray-900'
              )}>
                {formatCurrencyWithCode(totalBalance, preferences.preferredCurrency)}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <div className="min-w-full divide-y divide-gray-300">
                  {/* Account list */}
                  <div className="bg-white">
                    {accounts.length === 0 ? (
                      <div className="text-center px-4 py-4 sm:px-6">
                        <h3 className="text-sm font-medium text-gray-900">No accounts</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Get started by adding a new account.
                        </p>
                      </div>
                    ) : (
                      accounts.map((account, accountIdx) => {
                        const balance = Number(account.current_balance)
                        const convertedBalance = convertCurrency(
                          balance,
                          account.currency,
                          preferences.preferredCurrency
                        )

                        return (
                          <div
                            key={account.id}
                            className={cn(
                              accountIdx === 0 ? '' : 'border-t border-gray-200',
                              'px-4 py-4 sm:px-6'
                            )}
                          >
                            <div className="flex items-center justify-between">
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
                                  <Tooltip content={accountTypeDescriptions[account.type]}>
                                    <h3 className="font-medium text-gray-900 cursor-help">{account.name}</h3>
                                  </Tooltip>
                                  <p className="text-sm text-gray-500 capitalize">
                                    {account.type.replace('_', ' ')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Tooltip 
                                  content={
                                    account.type === 'credit_card' ? 'Negative amount indicates credit card balance to be paid' :
                                    account.type === 'loan' ? 'Negative amount indicates remaining loan balance to be repaid' :
                                    'Current balance in account'
                                  }
                                >
                                  <p className={cn(
                                    "text-lg font-medium cursor-help",
                                    (account.type === 'credit_card' || account.type === 'loan') ? 'text-red-600' : 'text-gray-900'
                                  )}>
                                    {formatCurrencyWithCode(
                                      // For credit cards and loans, ensure the balance is negative
                                      (account.type === 'credit_card' || account.type === 'loan') 
                                        ? -Math.abs(convertedBalance) 
                                        : convertedBalance,
                                      preferences.preferredCurrency
                                    )}
                                  </p>
                                </Tooltip>
                                {account.currency !== preferences.preferredCurrency && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    {formatCurrencyWithCode(
                                      (account.type === 'credit_card' || account.type === 'loan')
                                        ? -Math.abs(balance)
                                        : balance,
                                      account.currency
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

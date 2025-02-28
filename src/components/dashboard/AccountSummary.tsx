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
import { formatCurrencyWithCode, convertCurrency, formatExchangeRate } from '@/lib/utils/currencyConverter'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'
import { Tooltip } from '@/components/ui/Tooltip'
import { Sparkline } from '@/components/ui/Sparkline'
import { ChevronDown, ChevronRight } from 'lucide-react'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row']
type BalanceHistory = Tables['balance_history']['Row']
type AccountType = Account['type']

const accountTypeDescriptions = {
  checking: 'A standard bank account for everyday transactions',
  savings: 'An interest-bearing account for saving money',
  credit_card: 'A revolving credit line - negative balance indicates amount owed',
  loan: 'A borrowed amount to be repaid over time - negative balance indicates remaining debt',
  investment: 'An account holding stocks, bonds, or other investments',
  cash: 'Physical money held in cash'
} as const

const accountTypeOrder: AccountType[] = ['checking', 'savings', 'investment', 'cash', 'credit_card', 'loan']

export function AccountSummary() {
  const { preferences, loading: prefsLoading } = useUserPreferences()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [balanceHistory, setBalanceHistory] = useState<Record<string, BalanceHistory[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Record<AccountType, boolean>>({
    checking: true,
    savings: true,
    credit_card: true,
    loan: true,
    investment: true,
    cash: true
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: accounts, error: accountsError } = await supabase
          .from('accounts')
          .select('*')
          .order('name')

        if (accountsError) throw accountsError

        const { data: history, error: historyError } = await supabase
          .from('balance_history')
          .select('*')
          .in('account_id', accounts?.map(a => a.id) || [])
          .order('recorded_at', { ascending: true })

        if (historyError) throw historyError

        // Group history by account
        const historyByAccount = history?.reduce((acc, item) => {
          if (!acc[item.account_id]) {
            acc[item.account_id] = []
          }
          acc[item.account_id].push(item)
          return acc
        }, {} as Record<string, BalanceHistory[]>) || {}

        setAccounts(accounts || [])
        setBalanceHistory(historyByAccount)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to load accounts')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

  // Calculate group totals
  const getGroupTotal = (type: AccountType) => {
    return accounts
      .filter(account => account.type === type)
      .reduce((sum, account) => {
        const balance = Number(account.current_balance)
        const convertedBalance = convertCurrency(
          balance,
          account.currency,
          preferences.preferredCurrency
        )
        return sum + ((type === 'credit_card' || type === 'loan') ? -Math.abs(convertedBalance) : convertedBalance)
      }, 0)
  }

  // Get balance trend data for an account
  const getBalanceTrend = (account: Account) => {
    const history = balanceHistory[account.id] || []
    const points = history.map(h => {
      const balance = Number(h.balance)
      return convertCurrency(
        account.type === 'credit_card' || account.type === 'loan' ? -Math.abs(balance) : balance,
        h.currency,
        preferences.preferredCurrency
      )
    })

    // Add current balance as last point
    const currentBalance = convertCurrency(
      account.type === 'credit_card' || account.type === 'loan'
        ? -Math.abs(Number(account.current_balance))
        : Number(account.current_balance),
      account.currency,
      preferences.preferredCurrency
    )
    points.push(currentBalance)

    // If no history, create a simple trend
    if (points.length < 2) {
      const baseValue = Math.abs(currentBalance)
      return [
        baseValue * 0.9,
        baseValue * 0.95,
        baseValue * 0.93,
        baseValue * 0.97,
        baseValue * 0.96,
        baseValue * 0.98,
        currentBalance
      ]
    }

    return points
  }

  // Show loading state while fetching accounts or preferences
  if (loading || prefsLoading) {
    return (
      <div className="bg-white shadow-lg rounded-xl border border-gray-100">
        <div className="px-6 py-5">
          <div className="sm:flex sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold leading-6 text-gray-900">Account Summary</h3>
            <div className="mt-4 sm:mt-0">
              <div className="text-sm text-gray-600 flex items-center gap-1">
                Total Balance:{' '}
                <Tooltip content={
                  accounts.some(a => a.currency !== preferences.preferredCurrency)
                    ? `Converted from: ${accounts
                        .filter(a => a.currency !== preferences.preferredCurrency)
                        .map(a => `${formatCurrencyWithCode(
                          (a.type === 'credit_card' || a.type === 'loan')
                            ? -Math.abs(Number(a.current_balance))
                            : Number(a.current_balance),
                          a.currency
                        )}`)
                        .join(', ')}`
                    : 'All accounts are in your preferred currency'
                }>
                  <span className={cn(
                    "text-lg font-semibold cursor-help",
                    totalBalance < 0 ? 'text-red-600' : 'text-emerald-600'
                  )}>
                    {formatCurrencyWithCode(totalBalance, preferences.preferredCurrency)}
                  </span>
                </Tooltip>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="overflow-hidden">
              <div className="min-w-full">
                {/* Account list */}
                <div className="bg-white divide-y divide-gray-100">
                  <div className="text-center px-6 py-8 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900">No accounts</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by adding a new account.
                    </p>
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
    <div className="bg-white shadow-lg rounded-xl border border-gray-100">
      <div className="px-6 py-5">
        <div className="sm:flex sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold leading-6 text-gray-900">Account Summary</h3>
          <div className="mt-4 sm:mt-0">
            <div className="text-sm text-gray-600 flex items-center gap-1">
              Total Balance:{' '}
              <Tooltip content={
                accounts.some(a => a.currency !== preferences.preferredCurrency)
                  ? `Converted from: ${accounts
                      .filter(a => a.currency !== preferences.preferredCurrency)
                      .map(a => `${formatCurrencyWithCode(
                        (a.type === 'credit_card' || a.type === 'loan')
                          ? -Math.abs(Number(a.current_balance))
                          : Number(a.current_balance),
                        a.currency
                      )}`)
                      .join(', ')}`
                  : 'All accounts are in your preferred currency'
              }>
                <span className={cn(
                  "text-lg font-semibold cursor-help",
                  totalBalance < 0 ? 'text-red-600' : 'text-emerald-600'
                )}>
                  {formatCurrencyWithCode(totalBalance, preferences.preferredCurrency)}
                </span>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="overflow-hidden">
            <div className="min-w-full">
              {/* Account list */}
              <div className="bg-white">
                {accounts.length === 0 ? (
                  <div className="text-center px-6 py-8 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-900">No accounts</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by adding a new account.
                    </p>
                    <Button className="mt-4">
                      Add Account
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accountTypeOrder.map((type, idx) => {
                      const accountsOfType = accounts.filter(account => account.type === type)
                      if (accountsOfType.length === 0) return null

                      const groupTotal = getGroupTotal(type)
                      const isDebtType = type === 'credit_card' || type === 'loan'
                      const groupColor = isDebtType ? 'red' : groupTotal < 0 ? 'red' : 'emerald'

                      return (
                        <div 
                          key={type} 
                          className={cn(
                            'bg-white rounded-lg border border-gray-200 transition-all duration-200 ease-in-out overflow-hidden',
                            expandedGroups[type] ? 'shadow-md' : 'hover:shadow-md'
                          )}
                        >
                          <div className={cn(
                            'px-4 py-3',
                            expandedGroups[type] ? 'bg-gray-50' : 'hover:bg-gray-50'
                          )}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Button
                                  onClick={() => setExpandedGroups(prevState => ({ ...prevState, [type]: !prevState[type] }))}
                                  className={cn(
                                    'text-gray-500 p-1 rounded-lg transition-colors duration-200',
                                    'hover:bg-white hover:shadow-sm hover:text-gray-900',
                                    expandedGroups[type] ? 'bg-white shadow-sm' : 'bg-transparent'
                                  )}
                                >
                                  {expandedGroups[type] ? (
                                    <ChevronDown className="h-5 w-5" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5" />
                                  )}
                                </Button>
                                <div>
                                  <Tooltip content={accountTypeDescriptions[type]}>
                                    <h3 className="font-medium text-gray-900 cursor-help capitalize group flex items-center">
                                      {type.replace('_', ' ')} Accounts
                                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 group-hover:bg-gray-200 transition-colors duration-200">
                                        {accountsOfType.length}
                                      </span>
                                    </h3>
                                  </Tooltip>
                                  <p className={cn(
                                    "text-sm font-medium",
                                    `text-${groupColor}-600`
                                  )}>
                                    {formatCurrencyWithCode(groupTotal, preferences.preferredCurrency)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          {expandedGroups[type] && (
                            <div className="divide-y divide-gray-100 bg-white transition-all duration-200 ease-in-out max-h-[300px] overflow-y-auto">
                              {accountsOfType.map((account, accountIdx) => {
                                const balance = Number(account.current_balance)
                                const convertedBalance = convertCurrency(
                                  balance,
                                  account.currency,
                                  preferences.preferredCurrency
                                )

                                return (
                                  <div
                                    key={account.id}
                                    className="px-4 py-3 hover:bg-gray-50 transition-colors duration-200"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className={cn(
                                          "h-8 w-8 rounded-lg flex items-center justify-center",
                                          isDebtType ? 'bg-red-100' : 'bg-emerald-100'
                                        )}>
                                          <svg
                                            className={cn(
                                              "h-5 w-5",
                                              isDebtType ? 'text-red-600' : 'text-emerald-600'
                                            )}
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
                                          {account.institution && (
                                            <p className="text-sm text-gray-500">
                                              {account.institution}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right space-y-1">
                                        <Tooltip 
                                          content={
                                            account.type === 'credit_card' ? 'Negative amount indicates credit card balance to be paid' :
                                            account.type === 'loan' ? 'Negative amount indicates remaining loan balance to be repaid' :
                                            'Current balance in account'
                                          }
                                        >
                                          <p className={cn(
                                            "text-base font-medium cursor-help",
                                            isDebtType ? 'text-red-600' : convertedBalance < 0 ? 'text-red-600' : 'text-emerald-600'
                                          )}>
                                            {formatCurrencyWithCode(
                                              isDebtType ? -Math.abs(convertedBalance) : convertedBalance,
                                              preferences.preferredCurrency
                                            )}
                                          </p>
                                        </Tooltip>
                                        {account.currency !== preferences.preferredCurrency && (
                                          <Tooltip content={formatExchangeRate(account.currency, preferences.preferredCurrency)}>
                                            <p className="text-xs text-gray-500 cursor-help">
                                              {formatCurrencyWithCode(
                                                isDebtType ? -Math.abs(balance) : balance,
                                                account.currency
                                              )}
                                            </p>
                                          </Tooltip>
                                        )}
                                        <div className="mt-1">
                                          <Sparkline
                                            data={getBalanceTrend(account)}
                                            width={100}
                                            height={20}
                                            color={isDebtType ? '#DC2626' : '#059669'}
                                            className="ml-auto"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

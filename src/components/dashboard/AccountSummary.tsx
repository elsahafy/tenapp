'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Account } from '@/types'
import { formatCurrency } from '@/lib/utils/formatters'
import { WalletIcon } from '@heroicons/react/24/outline'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

export function AccountSummary() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: accounts, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (error) throw error

        setAccounts(accounts || [])
        const total = accounts?.reduce((sum, account) => sum + Number(account.current_balance), 0) || 0
        setTotalBalance(total)
      } catch (error) {
        console.error('Error fetching accounts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [])

  return (
    <Card variant="gradient" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div className="space-y-1">
          <CardTitle>Account Summary</CardTitle>
          <p className="text-sm text-gray-500">Overview of your financial accounts</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm text-gray-500">Total Balance</span>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              formatCurrency(totalBalance, 'USD')
            )}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100"
              >
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            ))
          ) : (
            <>
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={cn(
                    'group flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100',
                    'transition-all duration-200 hover:shadow-lg hover:border-primary-100'
                  )}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 p-2.5 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg group-hover:from-primary-100 group-hover:to-primary-200 transition-colors duration-200">
                      <WalletIcon className="h-5 w-5 text-primary-500 group-hover:text-primary-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                        {account.name}
                      </p>
                      <Badge variant="secondary" className="capitalize">
                        {account.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {formatCurrency(account.current_balance, account.currency)}
                    </div>
                  </div>
                </div>
              ))}
              {accounts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-6 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 p-4">
                    <WalletIcon className="h-8 w-8 text-primary-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No accounts yet</h3>
                  <p className="text-gray-500 text-sm mb-6">Add your first account to start tracking your finances</p>
                  <Button variant="default" size="lg" className="gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Account
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

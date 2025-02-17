'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/lib/utils/formatters'
import { Database } from '@/lib/database.types'
import { cn } from '@/lib/utils'

type CurrencyCode = Database['public']['Enums']['currency_code']

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  account_id: string
  account: {
    name: string
    currency: CurrencyCode
  }
  category_id: string
  categories: {
    name: string
  }
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: transactions, error } = await supabase
          .from('transactions')
          .select(`
            *,
            account:account_id (
              name,
              currency
            ),
            categories:category_id (
              name
            )
          `)
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(5)

        if (error) throw error
        setTransactions(transactions || [])
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  return (
    <Card variant="gradient" className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div className="space-y-1">
          <CardTitle>Recent Transactions</CardTitle>
          <p className="text-sm text-gray-500">Your latest financial activity</p>
        </div>
        <Badge variant="secondary">
          Last {transactions.length} transactions
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
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
              {transactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className={cn(
                    'group flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100',
                    'transition-all duration-200 hover:shadow-lg hover:border-primary-100',
                    'opacity-0 translate-y-2 animate-in'
                  )}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      'flex-shrink-0 p-2.5 rounded-lg transition-colors duration-200',
                      transaction.type === 'expense'
                        ? 'bg-red-50 text-red-500'
                        : 'bg-green-50 text-green-500'
                    )}>
                      {transaction.type === 'expense' ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20V4m0 16l4-4m-4 4l-4-4" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0-16l4 4m-4-4l-4 4" />
                        </svg>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                        {transaction.description}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {transaction.account?.name}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {transaction.categories?.name || 'Uncategorized'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      'text-sm font-bold',
                      transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                    )}>
                      {transaction.type === 'expense' ? '-' : '+'}
                      {formatCurrency(Math.abs(transaction.amount), transaction.account?.currency || 'USD')}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 rounded-full bg-gray-50 p-3">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No recent transactions</p>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

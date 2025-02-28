'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useUser } from '@/lib/hooks/useUser'
import { useAccounts } from '@/lib/hooks/useAccounts'
import { useTransactions } from '@/lib/hooks/useTransactions'
import { useRecurringTransactions } from '@/lib/hooks/useRecurringTransactions'
import { TransactionList } from '@/components/transactions/TransactionList'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Amount } from '@/components/ui/amount'
import type { Database } from '@/types/supabase'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row']

export default function TransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { accounts, loading: accountsLoading, refetch: refetchAccounts } = useAccounts()
  const { transactions, categories, stats, isLoading: transactionsLoading, refetch: refetchTransactions } = useTransactions()
  const { recurringTransactions, isLoading: recurringLoading } = useRecurringTransactions()
  const { user } = useUser() // Assuming you have a useUser hook

  const handleSaveTransaction = async () => {
    await Promise.all([refetchAccounts(), refetchTransactions()])
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Transactions</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all your transactions including income, expenses, and transfers between accounts.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Button
              onClick={() => setIsModalOpen(true)}
              disabled={accountsLoading || !accounts || accounts.length === 0}
            >
              Add Transaction
            </Button>
          </div>
        </div>

        {accountsLoading ? (
          <div className="mt-6 text-center text-sm text-gray-500">Loading accounts...</div>
        ) : !accounts || accounts.length === 0 ? (
          <div className="mt-6 text-center">
            <h3 className="text-sm font-medium text-gray-900">No accounts</h3>
            <p className="mt-1 text-sm text-gray-500">
              You need to create an account before you can add transactions.
            </p>
            <div className="mt-6">
              <Link href="/dashboard/accounts">
                <Button variant="outline" size="sm">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    <Amount value={stats.totalIncome} />
                  </div>
                  <p className="text-xs text-gray-500">
                    All time income from all accounts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    <Amount value={stats.totalExpenses} />
                  </div>
                  <p className="text-xs text-gray-500">
                    All time expenses from all accounts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                  <ScaleIcon className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <Amount value={stats.netIncome} />
                  </div>
                  <p className="text-xs text-gray-500">
                    Total income minus expenses
                  </p>
                </CardContent>
              </Card>
            </div>

            <TransactionList
              transactions={transactions || []} 
              accounts={accounts || []}
              categories={categories || []}
              recurringTransactions={recurringTransactions?.map(rt => ({
                ...rt,
                next_occurrence: rt.next_occurrence || new Date().toISOString()
              })) || []}
              isLoading={transactionsLoading || recurringLoading} 
              refetchTransactions={refetchTransactions}
              user={user}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

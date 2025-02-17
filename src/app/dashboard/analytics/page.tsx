'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Suspense } from 'react'
import { SpendingOverview } from '@/components/dashboard/SpendingOverview'
import dynamic from 'next/dynamic'
import { useTransactions } from '@/lib/hooks/useTransactions'

const CategoryBreakdown = dynamic(() => import('@/components/analytics/CategoryBreakdown'), {
  ssr: false
})

const TopTransactions = dynamic(() => import('@/components/analytics/TopTransactions'), {
  ssr: false
})

interface AnalyticsTransaction {
  id: string
  amount: number
  description: string
  category: string
  type: 'income' | 'expense'
  created_at: string
}

export default function AnalyticsPage() {
  const { transactions, categoryBreakdown } = useTransactions()

  const categorySpending = categoryBreakdown.map(item => ({
    category: item.category,
    amount: item.amount,
    percentage: item.percentage,
    transactions: item.transactions.length
  }))

  // Map transaction types to income/expense
  const mappedTransactions: AnalyticsTransaction[] = transactions.map(t => ({
    id: t.id,
    amount: t.amount,
    description: t.description,
    category: t.category_name || 'Uncategorized',
    // Map deposit to income, withdrawal and transfer to expense
    type: t.type === 'deposit' ? 'income' : 'expense',
    created_at: t.created_at
  }))

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Analytics</h1>

        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<div>Loading...</div>}>
              <SpendingOverview />
            </Suspense>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<div>Loading...</div>}>
              <CategoryBreakdown data={categorySpending} />
            </Suspense>
            <Suspense fallback={<div>Loading...</div>}>
              <TopTransactions transactions={mappedTransactions} />
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

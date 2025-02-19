'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { Suspense } from 'react'
import { SpendingOverview } from '@/components/dashboard/SpendingOverview'
import dynamic from 'next/dynamic'
import { useTransactions } from '@/lib/hooks/useTransactions'
import type { Database } from '@/types/supabase'
import { Transaction } from '@/components/analytics/TopTransactions'

type Category = Database['public']['Tables']['categories']['Row']

const CategoryBreakdown = dynamic(() => import('@/components/analytics/CategoryBreakdown'), {
  ssr: false
})

const TopTransactions = dynamic(() => import('@/components/analytics/TopTransactions'), {
  ssr: false
})

export default function AnalyticsPage() {
  const { transactions = [], categories = [], categoryBreakdown = [], isLoading } = useTransactions()

  // Only process data if we have it
  const categorySpending = categoryBreakdown?.map(item => ({
    category: item.category,
    amount: item.amount,
    percentage: item.percentage,
    transactions: item.transactions?.length || 0
  })) || []

  // Map transaction types to income/expense
  const mappedTransactions: Transaction[] = (transactions || []).map((t: Database['public']['Tables']['transactions']['Row']) => ({
    id: t.id,
    amount: t.amount,
    description: t.description,
    category: t.category_id ? categories.find(c => c.id === t.category_id)?.name || 'Uncategorized' : 'Uncategorized',
    // Map income/expense/transfer to income/expense
    type: t.type === 'transfer' ? 'expense' : t.type,
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
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<div>Loading...</div>}>
                <CategoryBreakdown data={categorySpending} />
              </Suspense>
              <Suspense fallback={<div>Loading...</div>}>
                <TopTransactions transactions={mappedTransactions} />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

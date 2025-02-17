'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type Debt = Database['public']['Tables']['debts']['Row']

interface DebtTrend {
  month: string
  totalDebt: number
  monthlyPayment: number
  debtToIncome: number
}

export function DebtAnalytics() {
  const { user } = useUser()
  const [debts, setDebts] = useState<Debt[]>([])
  const [trends, setTrends] = useState<DebtTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchDebts = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('debts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('due_date', { ascending: true })

        if (error) throw error

        setDebts(data || [])
      } catch (err) {
        console.error('Error fetching debts:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDebts()
  }, [user])

  useEffect(() => {
    if (!user) return

    const fetchDebtTrends = async () => {
      try {
        setLoading(true)
        const endDate = new Date()
        const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 5, 1)

        // Fetch active debts
        const { data: debts, error: debtsError } = await supabase
          .from('debts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (debtsError) throw debtsError

        // Fetch monthly income for debt-to-income ratio
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('amount, date, type')
          .eq('type', 'income')
          .gte('date', startDate.toISOString())
          .lte('date', endDate.toISOString())

        if (transactionsError) throw transactionsError

        // Calculate monthly trends
        const monthlyData: DebtTrend[] = []
        for (let i = 0; i <= 5; i++) {
          const currentMonth = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1)
          const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
          const monthIncome = transactions
            .filter(
              (t) =>
                new Date(t.date).getMonth() === monthStart.getMonth() &&
                new Date(t.date).getFullYear() === monthStart.getFullYear()
            )
            .reduce((sum, t) => sum + t.amount, 0)

          const totalDebt = debts.reduce((sum, debt) => sum + debt.current_balance, 0)
          const monthlyPayment = debts.reduce(
            (sum, debt) => sum + debt.minimum_payment,
            0
          )
          const debtToIncome = monthIncome > 0 ? (monthlyPayment / monthIncome) * 100 : 0

          monthlyData.unshift({
            month: new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(
              monthStart
            ),
            totalDebt,
            monthlyPayment,
            debtToIncome,
          })
        }

        setTrends(monthlyData)
      } catch (err) {
        console.error('Error fetching debt trends:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDebtTrends()
  }, [user])

  const totalDebt = debts.reduce((sum, debt) => sum + debt.current_balance, 0)
  const totalMinPayment = debts.reduce((sum, debt) => sum + debt.minimum_payment, 0)
  const averageInterestRate = debts.length
    ? debts.reduce((sum, debt) => sum + debt.interest_rate, 0) / debts.length
    : 0

  if (loading) {
    return <div>Loading debt analytics...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Debt</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            ${totalDebt.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Monthly Minimum Payments</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            ${totalMinPayment.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Average Interest Rate</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {averageInterestRate.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Debt Breakdown</h3>
          <div className="space-y-4">
            {debts.map((debt) => (
              <div
                key={debt.id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <h4 className="font-medium text-gray-900">{debt.name}</h4>
                  <p className="text-sm text-gray-500">
                    {debt.type} - {debt.interest_rate}% APR
                  </p>
                  {debt.due_date && (
                    <p className="text-xs text-gray-400">
                      Due: {new Date(debt.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    ${debt.current_balance.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Min: ${debt.minimum_payment.toLocaleString()}/mo
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Debt Trends</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Total Debt</h3>
                <p className="mt-2 text-3xl font-bold text-indigo-600">
                  ${trends[trends.length - 1]?.totalDebt.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Monthly Payments</h3>
                <p className="mt-2 text-3xl font-bold text-indigo-600">
                  ${trends[trends.length - 1]?.monthlyPayment.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Debt-to-Income Ratio</h3>
                <p className="mt-2 text-3xl font-bold text-indigo-600">
                  {trends[trends.length - 1]?.debtToIncome.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

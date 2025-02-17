'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

interface CashFlowStats {
  totalIncome: number
  totalExpenses: number
  netCashFlow: number
  monthOverMonthChange: number
}

export function CashFlow() {
  const [stats, setStats] = useState<CashFlowStats>({
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
    monthOverMonthChange: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCashFlowStats()
  }, [])

  async function fetchCashFlowStats() {
    try {
      // Current month data
      const currentStart = startOfMonth(new Date())
      const currentEnd = endOfMonth(new Date())

      // Previous month data
      const previousStart = startOfMonth(subMonths(new Date(), 1))
      const previousEnd = endOfMonth(subMonths(new Date(), 1))

      const [currentMonthData, previousMonthData] = await Promise.all([
        fetchMonthData(currentStart, currentEnd),
        fetchMonthData(previousStart, previousEnd),
      ])

      const monthOverMonthChange =
        ((currentMonthData.netCashFlow - previousMonthData.netCashFlow) /
          Math.abs(previousMonthData.netCashFlow || 1)) *
        100

      setStats({
        ...currentMonthData,
        monthOverMonthChange,
      })
    } catch (error) {
      console.error('Error fetching cash flow stats:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMonthData(start: Date, end: Date) {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, type')
      .gte('date', start.toISOString())
      .lte('date', end.toISOString())

    if (error) throw error

    const stats = data.reduce(
      (acc, { amount, type }) => {
        const value = Math.abs(Number(amount))
        if (type === 'income') acc.totalIncome += value
        else if (type === 'expense') acc.totalExpenses += value
        return acc
      },
      { totalIncome: 0, totalExpenses: 0 }
    )

    return {
      ...stats,
      netCashFlow: stats.totalIncome - stats.totalExpenses,
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Cash Flow</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-500">Total Income</p>
              <span className="text-sm font-medium text-green-600">
                This Month
              </span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              ${stats.totalIncome.toLocaleString()}
            </p>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-500">Total Expenses</p>
              <span className="text-sm font-medium text-red-600">
                This Month
              </span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              ${stats.totalExpenses.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-500">Net Cash Flow</p>
            <div className="flex items-center space-x-1">
              {stats.monthOverMonthChange > 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  stats.monthOverMonthChange > 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {Math.abs(stats.monthOverMonthChange).toFixed(1)}% vs last month
              </span>
            </div>
          </div>
          <p
            className={`text-3xl font-bold ${
              stats.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            ${Math.abs(stats.netCashFlow).toLocaleString()}
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {format(new Date(), 'MMMM yyyy')}
            </p>
            <p
              className={`text-sm font-medium ${
                stats.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {stats.netCashFlow >= 0 ? 'Positive' : 'Negative'} Cash Flow
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

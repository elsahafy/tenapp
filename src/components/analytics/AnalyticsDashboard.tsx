'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import {
  getSpendingByCategory,
  getMonthlyTrends,
  getCashFlowAnalysis,
  detectAnomalies,
  type CategorySpending,
  type MonthlyTrend,
  type CashFlowAnalysis,
  type Anomaly,
} from '@/lib/services/analyticsService'
import CategoryBreakdown from './CategoryBreakdown'
import TopTransactions from './TopTransactions'
import { formatCurrency, formatPercentage } from '@/lib/utils/format'

type TimeframeOption = '1m' | '3m' | '6m' | '1y'

interface DashboardState {
  categorySpending: CategorySpending[]
  monthlyTrends: MonthlyTrend[]
  cashFlow: CashFlowAnalysis | null
  anomalies: Anomaly[]
  loading: boolean
  error: string | null
}

export default function AnalyticsDashboard() {
  const { user } = useAuth()
  const [timeframe, setTimeframe] = useState<TimeframeOption>('1m')
  const [state, setState] = useState<DashboardState>({
    categorySpending: [],
    monthlyTrends: [],
    cashFlow: null,
    anomalies: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user, timeframe])

  const fetchAnalytics = async () => {
    if (!user) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const [categoryData, trendsData, cashFlowData, anomaliesData] = await Promise.all([
        getSpendingByCategory(user.id, timeframe),
        getMonthlyTrends(user.id, timeframe),
        getCashFlowAnalysis(user.id, timeframe),
        detectAnomalies(user.id),
      ])

      setState({
        categorySpending: categoryData,
        monthlyTrends: trendsData,
        cashFlow: cashFlowData,
        anomalies: anomaliesData,
        loading: false,
        error: null,
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load analytics data',
      }))
    }
  }

  if (!user) {
    return (
      <div className="text-center text-gray-600">
        Please log in to view analytics
      </div>
    )
  }

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="text-center text-red-600">
        Error: {state.error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-md shadow-sm">
          {(['1m', '3m', '6m', '1y'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setTimeframe(option)}
              className={`px-4 py-2 text-sm font-medium ${
                timeframe === option
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } ${
                option === '1m'
                  ? 'rounded-l-md'
                  : option === '1y'
                  ? 'rounded-r-md'
                  : ''
              } border border-gray-300`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Cash Flow Summary */}
      {state.cashFlow && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {formatCurrency(state.cashFlow.totalIncome)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {formatCurrency(state.cashFlow.totalExpenses)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Net Savings</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {formatCurrency(state.cashFlow.netSavings)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Savings Rate</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {formatPercentage(state.cashFlow.savingsRate)}
            </p>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <CategoryBreakdown data={state.categorySpending} />

      {/* Monthly Trends Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trends</h3>
        <div className="h-64">
          {/* Add your line chart component here */}
        </div>
      </div>

      {/* Anomalies */}
      {state.anomalies.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Detected Anomalies
          </h3>
          <div className="space-y-4">
            {state.anomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {anomaly.description}
                  </p>
                  <p className="text-sm text-yellow-600">
                    {new Date(anomaly.date).toLocaleDateString()} •{' '}
                    {formatCurrency(anomaly.amount)}
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {anomaly.confidence}% confidence
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

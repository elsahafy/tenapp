'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { cn, formatCurrency } from '@/lib/utils'

ChartJS.register(ArcElement, Tooltip, Legend)

interface TransactionWithCategory {
  amount: number
  categories: {
    name: string | null
  } | null
}

interface SpendingByCategory {
  name: string
  total: number
}

const chartColors = [
  { from: '#f87171', to: '#ef4444' }, // Red
  { from: '#60a5fa', to: '#3b82f6' }, // Blue
  { from: '#fbbf24', to: '#f59e0b' }, // Yellow
  { from: '#34d399', to: '#10b981' }, // Green
  { from: '#a78bfa', to: '#8b5cf6' }, // Purple
  { from: '#f472b6', to: '#ec4899' }, // Pink
]

export function SpendingOverview() {
  const [spendingData, setSpendingData] = useState<SpendingByCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSpending, setTotalSpending] = useState(0)

  useEffect(() => {
    const fetchSpendingData = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('transactions')
          .select('*, categories:category_id(name)')
          .eq('type', 'expense')
          .gte('date', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())

        if (error) throw error

        const spendingByCategory = (data || []).reduce<{ [key: string]: number }>((acc, transaction) => {
          const category = transaction.categories?.name || 'Uncategorized'
          const amount = Math.abs(Number(transaction.amount))
          acc[category] = (acc[category] || 0) + amount
          return acc
        }, {})

        const categories = Object.entries(spendingByCategory)
          .map(([name, total]) => ({ name, total }))
          .sort((a, b) => b.total - a.total)

        const total = categories.reduce((sum, cat) => sum + cat.total, 0)
        setTotalSpending(total)
        setSpendingData(categories)
      } catch (error) {
        console.error('Error fetching spending data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSpendingData()
  }, [])

  const chartData = {
    labels: spendingData.map(item => item.name),
    datasets: [
      {
        data: spendingData.map(item => item.total),
        backgroundColor: chartColors.map(color => color.from),
        hoverBackgroundColor: chartColors.map(color => color.to),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    cutout: '75%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#111827',
        bodyColor: '#4B5563',
        bodyFont: {
          size: 12,
          family: "'Inter', sans-serif",
        },
        padding: 12,
        boxPadding: 8,
        borderColor: '#E5E7EB',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const value = context.raw
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${formatCurrency(value, 'USD')} (${percentage}%)`
          }
        }
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true
    }
  }

  return (
    <Card variant="gradient" className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div className="space-y-1">
          <CardTitle>Spending Overview</CardTitle>
          <p className="text-sm text-gray-500">Last 30 days spending by category</p>
        </div>
        <Badge variant="secondary">
          Total: {loading ? '--' : formatCurrency(totalSpending, 'USD')}
        </Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-8">
            <Skeleton className="h-64 w-64 rounded-full mx-auto" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="relative w-64 h-64 mx-auto">
              <Doughnut data={chartData} options={chartOptions} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {spendingData.length}
                  </div>
                  <div className="text-sm text-gray-500">Categories</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {spendingData.map((category, index) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between transition-all duration-200 ease-in-out opacity-0 translate-y-2 animate-in"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: chartColors[index % chartColors.length].from }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {category.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(category.total, 'USD')}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({((category.total / totalSpending) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && spendingData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-gray-50 p-3">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No spending data available for the last 30 days</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

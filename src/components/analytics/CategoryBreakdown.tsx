'use client'

import { useState, useEffect } from 'react'
import { CategorySpending } from '@/lib/services/analyticsService'
import { formatCurrency } from '@/lib/utils/format'
import { PieChart } from '@/components/charts/PieChart'

interface CategoryBreakdownProps {
  data: CategorySpending[]
  onCategoryClick?: (category: string) => void
}

export default function CategoryBreakdown({ data, onCategoryClick }: CategoryBreakdownProps) {
  const [chartData, setChartData] = useState<{
    labels: string[]
    values: number[]
    colors: string[]
  }>({ labels: [], values: [], colors: [] })

  useEffect(() => {
    if (data) {
      const colors = generateColors(data.length)
      setChartData({
        labels: data.map(item => item.category),
        values: data.map(item => item.amount),
        colors
      })
    }
  }, [data])

  const generateColors = (count: number): string[] => {
    const baseColors = [
      '#3B82F6', // blue-500
      '#10B981', // emerald-500
      '#F59E0B', // amber-500
      '#EF4444', // red-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#6366F1', // indigo-500
      '#14B8A6', // teal-500
    ]

    if (count <= baseColors.length) {
      return baseColors.slice(0, count)
    }

    // If we need more colors, generate them by adjusting hue
    const additionalColors = Array.from({ length: count - baseColors.length }, (_, i) => {
      const hue = (360 * (i + baseColors.length)) / count
      return `hsl(${hue}, 70%, 50%)`
    })

    return [...baseColors, ...additionalColors]
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Spending by Category
      </h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-64">
          <PieChart
            data={chartData.values}
            labels={chartData.labels}
            colors={chartData.colors}
          />
        </div>
        <div className="space-y-4">
          {data.map((category, index) => (
            <div
              key={category.category}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
              onClick={() => onCategoryClick?.(category.category)}
            >
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: chartData.colors[index] }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {category.category}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(category.amount)}
                </div>
                <div className="text-xs text-gray-500">
                  {category.percentage.toFixed(1)}% ({category.transactions} transactions)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

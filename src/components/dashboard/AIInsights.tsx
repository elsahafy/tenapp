'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LightBulbIcon } from '@heroicons/react/24/outline'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

interface Insight {
  type: 'spending' | 'saving' | 'investment' | 'debt'
  message: string
  priority: 'low' | 'medium' | 'high'
}

const insightConfig = {
  spending: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    colors: {
      low: 'text-blue-600 bg-blue-50',
      medium: 'text-blue-600 bg-blue-50',
      high: 'text-blue-600 bg-blue-50'
    }
  },
  saving: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    colors: {
      low: 'text-blue-600 bg-blue-50',
      medium: 'text-blue-600 bg-blue-50',
      high: 'text-blue-600 bg-blue-50'
    }
  },
  investment: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    colors: {
      low: 'text-blue-600 bg-blue-50',
      medium: 'text-blue-600 bg-blue-50',
      high: 'text-blue-600 bg-blue-50'
    }
  },
  debt: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    colors: {
      low: 'text-blue-600 bg-blue-50',
      medium: 'text-blue-600 bg-blue-50',
      high: 'text-blue-600 bg-blue-50'
    }
  }
}

export function AIInsights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateInsights()
  }, [])

  async function generateInsights() {
    try {
      // Fetch user's transaction data
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .limit(100)

      // Fetch user's accounts
      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')

      // Example insights generation (this would be replaced with actual AI analysis)
      const generatedInsights: Insight[] = []

      // Spending patterns insight
      const totalSpending = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0

      if (totalSpending > 5000) {
        generatedInsights.push({
          type: 'spending',
          message: 'Your spending has increased significantly this month. Consider reviewing your expenses.',
          priority: 'high'
        })
      }

      // Savings opportunity insight
      const savingsAccounts = accounts?.filter(a => a.type === 'savings') || []
      if (savingsAccounts.length === 0) {
        generatedInsights.push({
          type: 'saving',
          message: 'Consider opening a savings account to start building your emergency fund.',
          priority: 'medium'
        })
      }

      // Investment insight
      const investmentAccounts = accounts?.filter(a => a.type === 'investment') || []
      if (investmentAccounts.length === 0) {
        generatedInsights.push({
          type: 'investment',
          message: 'You might want to explore investment opportunities to grow your wealth.',
          priority: 'low'
        })
      }

      setInsights(generatedInsights)
    } catch (error) {
      console.error('Error generating insights:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full bg-white shadow-sm border border-gray-100">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <LightBulbIcon className="h-4 w-4 text-blue-600" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">AI Insights</CardTitle>
            <p className="text-sm text-gray-500">Smart financial recommendations</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100">
          {insights.length} {insights.length === 1 ? 'Insight' : 'Insights'}
        </Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {insights.length > 0 ? (
              insights.map((insight, index) => (
                <div
                  key={index}
                  className="group flex items-start space-x-3 p-3 rounded-lg bg-white border border-gray-100 hover:border-blue-100 hover:shadow-sm transition-all duration-200"
                >
                  <div className={cn(
                    'flex-shrink-0 p-2 rounded-lg transition-colors duration-200',
                    insightConfig[insight.type].colors[insight.priority]
                  )}>
                    {insightConfig[insight.type].icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)} Insight
                    </p>
                    <p className="text-sm text-gray-600">
                      {insight.message}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 rounded-full bg-blue-50 p-2">
                  <LightBulbIcon className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-gray-500 text-sm">No insights available at the moment</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

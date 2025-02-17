import { useState, useEffect } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import {
  SavingsRule,
  getSavingsRules,
  getSavingsRuleAnalytics,
} from '@/lib/services/savingsRuleService'
import { formatCurrency } from '@/lib/utils/format'
import {
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface Props {
  onEdit: (rule: SavingsRule) => void
  onDelete: (rule: SavingsRule) => void
}

export default function SavingsRulesList({ onEdit, onDelete }: Props) {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rules, setRules] = useState<SavingsRule[]>([])
  const [analytics, setAnalytics] = useState<Record<string, any>>({})

  useEffect(() => {
    if (!user?.id) return
    loadRules()
  }, [user?.id])

  const loadRules = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSavingsRules(user!.id)
      setRules(data)

      // Load analytics for each rule
      const analyticsData: Record<string, any> = {}
      for (const rule of data) {
        try {
          analyticsData[rule.id] = await getSavingsRuleAnalytics(rule.id)
        } catch (error) {
          console.error(`Error loading analytics for rule ${rule.id}:`, error)
        }
      }
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error loading savings rules:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center text-gray-600">
        Please log in to view savings rules
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error loading savings rules: {error}
      </div>
    )
  }

  if (rules.length === 0) {
    return (
      <div className="text-center text-gray-600 py-8">
        No savings rules found
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
      {rules.map((rule) => {
        const ruleAnalytics = analytics[rule.id] || {}
        return (
          <div
            key={rule.id}
            className={`p-4 hover:bg-gray-50 ${
              !rule.active ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {rule.name}
                  </p>
                  {!rule.active && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <CurrencyDollarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  <span>
                    {rule.type === 'fixed'
                      ? formatCurrency(rule.amount)
                      : `${rule.amount}%`}{' '}
                    {rule.type === 'fixed' ? 'fixed amount' : 'of balance'}
                  </span>
                  <span className="mx-2">•</span>
                  <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  <span>
                    {rule.frequency.charAt(0).toUpperCase() +
                      rule.frequency.slice(1)}
                  </span>
                </div>

                {rule.condition_type && (
                  <div className="mt-1 text-sm text-gray-500">
                    Condition:{' '}
                    {rule.condition_type === 'balance_above'
                      ? `Balance above ${formatCurrency(
                          rule.condition_value || 0
                        )}`
                      : rule.condition_type === 'income_received'
                      ? 'When income is received'
                      : 'Always'}
                  </div>
                )}

                {ruleAnalytics && (
                  <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-gray-500">
                    <div>
                      <span className="block font-medium">Total Saved</span>
                      <span>{formatCurrency(ruleAnalytics.total_amount || 0)}</span>
                    </div>
                    <div>
                      <span className="block font-medium">Success Rate</span>
                      <span>
                        {((ruleAnalytics.success_rate || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="block font-medium">Monthly Avg</span>
                      <span>
                        {formatCurrency(ruleAnalytics.monthly_average || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => onEdit(rule)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onDelete(rule)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-500">
              {rule.source_account_id && (
                <p>From account: {rule.source_account_id}</p>
              )}
              {rule.goal_id && (
                <p>Goal: {rule.goal_id}</p>
              )}
            </div>

            {rule.next_execution_at && (
              <div className="mt-1 text-xs text-gray-500">
                Next execution:{' '}
                {new Date(rule.next_execution_at).toLocaleDateString()}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

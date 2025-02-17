import { useState, useEffect } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils/format'
import {
  CalendarIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline'

type BaseRecurringTransaction = Database['public']['Tables']['recurring_transactions']['Row']

interface Props {
  onEdit: (transaction: BaseRecurringTransaction) => void
  onDelete: (transaction: BaseRecurringTransaction) => void
}

type RecurringTransactionWithDetails = BaseRecurringTransaction & {
  category?: { id: string; name: string }
  account?: { id: string; name: string }
}

export default function RecurringTransactionList({ onEdit, onDelete }: Props) {
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<RecurringTransactionWithDetails[]>([])

  useEffect(() => {
    if (!user?.id) return

    const fetchTransactions = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('recurring_transactions')
          .select(`
            *,
            category:categories(id, name),
            account:accounts(id, name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setTransactions(data || [])
      } catch (err) {
        console.error('Error fetching recurring transactions:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [user?.id])

  if (!user) {
    return (
      <div className="text-center text-gray-600">
        Please log in to view recurring transactions
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
        Error loading recurring transactions: {error}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center text-gray-600 py-8">
        No recurring transactions found
      </div>
    )
  }

  const getFrequencyText = (transaction: BaseRecurringTransaction): string => {
    const base = transaction.frequency.charAt(0).toUpperCase() +
      transaction.frequency.slice(1)

    switch (transaction.frequency) {
      case 'monthly':
        if (transaction.day_of_month) {
          return `${base} (Day ${transaction.day_of_month})`
        }
        if (transaction.week_of_month && transaction.day_of_week !== null) {
          const weeks = ['first', 'second', 'third', 'fourth', 'last']
          const days = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ]
          return `${base} (${weeks[transaction.week_of_month - 1]} ${
            days[transaction.day_of_week]
          })`
        }
        return base

      case 'weekly':
        if (transaction.day_of_week !== null) {
          const days = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ]
          return `${base} (${days[transaction.day_of_week]})`
        }
        return base

      default:
        return base
    }
  }

  const getTransactionIcon = (type: string) => {
    if (type === 'deposit') {
      return (
        <ArrowDownIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
      )
    } else if (type === 'withdrawal') {
      return (
        <ArrowUpIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
      )
    } else {
      return (
        <ArrowsRightLeftIcon
          className="h-5 w-5 text-gray-500"
          aria-hidden="true"
        />
      )
    }
  }

  const getTransactionTypeClass = (type: string) => {
    if (type === 'deposit') {
      return 'text-green-700 bg-green-50 ring-green-600/20'
    } else if (type === 'withdrawal') {
      return 'text-red-700 bg-red-50 ring-red-600/20'
    } else {
      return 'text-blue-700 bg-blue-50 ring-blue-600/20'
    }
  }

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <ul className="divide-y divide-gray-200">
        {transactions.map((transaction) => (
          <li
            key={transaction.id}
            className={`p-4 hover:bg-gray-50 ${
              !transaction.active ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {transaction.description || 'No description'}
                  </p>
                  {!transaction.active && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="mt-1">
                  <p
                    className={`text-sm ${
                      transaction.type === 'deposit'
                        ? 'text-green-600'
                        : transaction.type === 'withdrawal'
                        ? 'text-red-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {transaction.type === 'withdrawal' ? '-' : '+'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                </div>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  <span>{getFrequencyText(transaction)}</span>
                  <span className="mx-2">•</span>
                  <span>Next: {new Date(transaction.next_occurrence).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => onEdit(transaction)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onDelete(transaction)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              <span>
                {transaction.category?.name || 'Uncategorized'} •{' '}
                {transaction.account?.name || 'Unknown Account'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

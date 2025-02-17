'use client'

import { useState, useEffect } from 'react'
import type { Transaction, TransactionFilter } from '@/lib/types/database'
import { getTransactions, getTransactionAnalytics } from '@/lib/services/transactionService'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsRightLeftIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

type DateRange = TransactionFilter['dateRange']

interface Props {
  accountId?: string
  onTransactionClick?: (transaction: Transaction) => void
}

export default function TransactionList({ accountId, onTransactionClick }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TransactionFilter>({
    type: 'all',
    status: 'all',
    dateRange: 'all',
    searchTerm: '',
  })

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('Not authenticated')
        }

        let query = supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)

        if (accountId) {
          query = query.eq('account_id', accountId)
        }

        if (filter.type !== 'all') {
          query = query.eq('type', filter.type)
        }

        if (filter.status !== 'all') {
          query = query.eq('status', filter.status)
        }

        if (filter.searchTerm) {
          query = query.ilike('description', `%${filter.searchTerm}%`)
        }

        const { data, error } = await query

        if (error) throw error
        setTransactions(data || [])
      } catch (error) {
        console.error('Error loading transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [filter, accountId])

  const handleTypeFilter = (type: TransactionFilter['type']) => {
    setFilter(prev => ({ ...prev, type }))
  }

  const handleStatusFilter = (status: TransactionFilter['status']) => {
    setFilter(prev => ({ ...prev, status }))
  }

  const handleDateFilter = (dateRange: DateRange) => {
    setFilter(prev => ({ ...prev, dateRange }))
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex space-x-4 mb-4">
        <select
          value={filter.type}
          onChange={(e) => handleTypeFilter(e.target.value as TransactionFilter['type'])}
          className="rounded-md border-gray-300"
        >
          <option value="all">All Types</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">Withdrawals</option>
          <option value="transfer">Transfers</option>
        </select>

        <select
          value={filter.status}
          onChange={(e) => handleStatusFilter(e.target.value as TransactionFilter['status'])}
          className="rounded-md border-gray-300"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <select
          value={filter.dateRange}
          onChange={(e) => handleDateFilter(e.target.value as DateRange)}
          className="rounded-md border-gray-300"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="Search transactions..."
            value={filter.searchTerm}
            onChange={(e) =>
              setFilter(prev => ({ ...prev, searchTerm: e.target.value }))
            }
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-600 truncate">
                    {transaction.description}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : transaction.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      {transaction.type}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: transaction.currency || 'USD',
                      }).format(transaction.amount)}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

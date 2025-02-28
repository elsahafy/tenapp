'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Database } from '@/types/supabase'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { AddTransactionModal } from './AddTransactionModal'

type Tables = Database['public']['Tables']
type Transaction = Tables['transactions']['Row']
type Account = Tables['accounts']['Row']
type Category = Tables['categories']['Row']

interface TransactionListProps {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  recurringTransactions: any[]
  isLoading: boolean
  className?: string
  refetchTransactions: () => void
  user: any
}

const DATE_RANGES = [
  { label: 'Last 30 days', value: '30days' },
  { label: 'Last 90 days', value: '90days' },
  { label: 'All time', value: 'all' },
]

export function TransactionList({ 
  transactions = [], 
  accounts, 
  categories, 
  recurringTransactions, 
  isLoading, 
  className, 
  refetchTransactions,
  user 
}: TransactionListProps) {
  const [dateRange, setDateRange] = useState('30days')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)

  const getAccountName = (accountId: string) => {
    return accounts.find(a => a.id === accountId)?.name || 'Unknown Account'
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Uncategorized'
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="block rounded-md border-gray-300 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
          >
            {DATE_RANGES.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-x-1.5"
          >
            <ArrowPathIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            Add Transaction
          </Button>
        </div>
      </div>

      {showAdd && (
        <AddTransactionModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            refetchTransactions();
          }}
          user={user}
          accounts={accounts}
          categories={categories}
          refetchTransactions={refetchTransactions}
        />
      )}

      <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-4">
        {/* Transaction filters */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('all')}
            className="cursor-pointer"
          >
            All
          </Badge>
          <Badge
            variant={typeFilter === 'income' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('income')}
            className="cursor-pointer"
          >
            Income
          </Badge>
          <Badge
            variant={typeFilter === 'expense' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('expense')}
            className="cursor-pointer"
          >
            Expenses
          </Badge>
          <Badge
            variant={typeFilter === 'transfer' ? 'default' : 'outline'}
            onClick={() => setTypeFilter('transfer')}
            className="cursor-pointer"
          >
            Transfers
          </Badge>
        </div>
      </div>

      {/* Transaction list */}
      <div className="mt-6 overflow-hidden">
        <div className="flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full">
                <thead className="bg-white">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Description
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Category
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Account
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-t border-gray-200">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-3">
                        {format(new Date(transaction.date), 'MMM d, yyyy')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {transaction.category_id ? getCategoryName(transaction.category_id) : 'Transfer'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {getAccountName(transaction.account_id)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                        <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { formatCurrency, formatTimeAgo } from '@/lib/utils/format'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'

interface Transaction {
  id: string
  amount: number
  description: string
  category: string
  type: 'income' | 'expense'
  created_at: string
}

interface TopTransactionsProps {
  transactions: Transaction[]
  onTransactionClick?: (transactionId: string) => void
}

export default function TopTransactions({ transactions, onTransactionClick }: TopTransactionsProps) {
  const [view, setView] = useState<'income' | 'expense'>('expense')
  const filteredTransactions = transactions
    .filter(t => t.type === view)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Top {view === 'expense' ? 'Expenses' : 'Income'}
        </h3>
        <div className="flex rounded-md shadow-sm">
          <button
            onClick={() => setView('expense')}
            className={`relative inline-flex items-center px-3 py-2 text-sm font-semibold ${
              view === 'expense'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } rounded-l-md focus:z-10`}
          >
            Expenses
          </button>
          <button
            onClick={() => setView('income')}
            className={`relative -ml-px inline-flex items-center px-3 py-2 text-sm font-semibold ${
              view === 'income'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } rounded-r-md focus:z-10`}
          >
            Income
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
            onClick={() => onTransactionClick?.(transaction.id)}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-full ${
                  transaction.type === 'income'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {transaction.type === 'income' ? (
                  <ArrowUpIcon className="h-5 w-5" />
                ) : (
                  <ArrowDownIcon className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {transaction.description}
                </div>
                <div className="text-sm text-gray-500">
                  {transaction.category} • {formatTimeAgo(transaction.created_at)}
                </div>
              </div>
            </div>
            <div
              className={`text-right font-medium ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(Math.abs(transaction.amount))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

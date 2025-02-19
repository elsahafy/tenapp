'use client'

import { useState } from 'react'
import type { Database } from '@/types/supabase'
import { Amount } from '@/components/ui/amount'
import { format } from 'date-fns'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsRightLeftIcon,
  CalendarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { cn } from '@/lib/utils'

type Tables = Database['public']['Tables']
type Transaction = Tables['transactions']['Row']
type Account = Tables['accounts']['Row']
type Category = Tables['categories']['Row']

interface TransactionListProps {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  isLoading: boolean
  className?: string
}

const dateRanges = [
  { label: 'Last 7 days', value: '7days' },
  { label: 'Last 30 days', value: '30days' },
  { label: 'Last 90 days', value: '90days' },
  { label: 'This year', value: 'year' },
  { label: 'All time', value: 'all' },
]

export function TransactionList({ transactions, accounts, categories, isLoading, className }: TransactionListProps) {
  const [dateRange, setDateRange] = useState('30days')
  const [typeFilter, setTypeFilter] = useState('all')

  const getAccountName = (accountId: string) => {
    return accounts.find(a => a.id === accountId)?.name || 'Unknown Account'
  }

  const getTransactionIcon = (type: string, amount: number) => {
    if (type === 'transfer') {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
          <ArrowsRightLeftIcon className="h-5 w-5 text-gray-600" aria-hidden="true" />
        </div>
      )
    }
    return amount > 0 ? (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
        <ArrowUpIcon className="h-5 w-5 text-green-600" aria-hidden="true" />
      </div>
    ) : (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
        <ArrowDownIcon className="h-5 w-5 text-red-600" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className={cn('mt-8 flow-root', className)}>
      <div className="flex items-center justify-between mb-4">
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <Menu.Button className="group inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900">
              <CalendarIcon
                className="mr-2 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                aria-hidden="true"
              />
              {dateRanges.find(r => r.value === dateRange)?.label}
            </Menu.Button>
          </div>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 z-10 mt-2 w-40 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {dateRanges.map((range) => (
                  <Menu.Item key={range.value}>
                    {({ active }) => (
                      <button
                        onClick={() => setDateRange(range.value)}
                        className={cn(
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                          'block px-4 py-2 text-sm w-full text-left'
                        )}
                      >
                        {range.label}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

        <Menu as="div" className="relative inline-block text-left">
          <div>
            <Menu.Button className="group inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900">
              <FunnelIcon
                className="mr-2 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                aria-hidden="true"
              />
              {typeFilter === 'all' ? 'All Types' : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
            </Menu.Button>
          </div>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {['all', 'income', 'expense', 'transfer'].map((type) => (
                  <Menu.Item key={type}>
                    {({ active }) => (
                      <button
                        onClick={() => setTypeFilter(type)}
                        className={cn(
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                          'block px-4 py-2 text-sm w-full text-left'
                        )}
                      >
                        {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-gray-500">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-sm font-medium text-gray-900">No transactions</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new transaction.</p>
        </div>
      ) : (
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Description
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Account
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Category
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-0">
                      {format(new Date(transaction.date), 'MMM d, yyyy')}
                    </td>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {transaction.description || (
                        transaction.category_id ? categories.find(c => c.id === transaction.category_id)?.name : 'Uncategorized'
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {getAccountName(transaction.account_id)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize bg-gray-100 text-gray-800">
                        {transaction.category_id ? categories.find(c => c.id === transaction.category_id)?.name : 'Uncategorized'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                      <Amount 
                        value={transaction.amount} 
                        className={cn(
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600',
                          'font-medium'
                        )}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

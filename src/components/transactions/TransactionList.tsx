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
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

type Tables = Database['public']['Tables']
type Transaction = Tables['transactions']['Row']
type Account = {
  id: string
  name: string
  currency: Database['public']['Enums']['currency_code']
  current_balance: number
  credit_limit: number | null
  interest_rate: number | null
  due_date: number | null
  institution: string | null
  is_active: boolean | null
  created_at: string
  updated_at: string
  user_id: string
  collateral: string | null
  type: Database['public']['Enums']['account_type']
}
type Category = Tables['categories']['Row']
type RecurringTransaction = Tables['recurring_transactions']['Row']

interface TransactionListProps {
  transactions?: Transaction[]
  accounts: Account[]
  categories: Category[]
  recurringTransactions: RecurringTransaction[]
  isLoading: boolean
  className?: string
}

const DATE_RANGES = [
  { label: 'Last 30 days', value: '30days' },
  { label: 'Last 90 days', value: '90days' },
  { label: 'This year', value: 'year' },
  { label: 'All time', value: 'all' },
]

export function TransactionList({ transactions = [], accounts, categories, recurringTransactions, isLoading, className }: TransactionListProps) {
  const [dateRange, setDateRange] = useState('30days')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showRecurring, setShowRecurring] = useState(false)

  const getAccountName = (accountId: string) => {
    return accounts.find(a => a.id === accountId)?.name || 'Unknown Account'
  }

  return (
    <div className={cn('px-4 sm:px-6 lg:px-8', className)}>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Transactions</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all your transactions including their date, description, amount and status.
          </p>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              {DATE_RANGES.find(r => r.value === dateRange)?.label || 'Select date range'}
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
            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {DATE_RANGES.map((range) => (
                  <Menu.Item key={range.value}>
                    {({ active }) => (
                      <button
                        onClick={() => setDateRange(range.value)}
                        className={cn(
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                          'block w-full px-4 py-2 text-left text-sm'
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
            <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              {typeFilter === 'all' ? 'All types' : typeFilter}
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
            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setTypeFilter('all')}
                      className={cn(
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'block w-full px-4 py-2 text-left text-sm'
                      )}
                    >
                      All types
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setTypeFilter('income')}
                      className={cn(
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'block w-full px-4 py-2 text-left text-sm'
                      )}
                    >
                      Income
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setTypeFilter('expense')}
                      className={cn(
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'block w-full px-4 py-2 text-left text-sm'
                      )}
                    >
                      Expense
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

        <Button
          variant="outline"
          onClick={() => setShowRecurring(!showRecurring)}
        >
          {showRecurring ? 'Show Regular' : 'Show Recurring'}
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-8 text-center">Loading...</div>
      ) : (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Account
                    </th>
                    <th
                      scope="col"
                      className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="whitespace-nowrap px-2 py-3.5 text-right text-sm font-semibold text-gray-900"
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {showRecurring ? (
                    recurringTransactions?.map((rt) => (
                      <tr key={rt.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-0">
                          {format(new Date(rt.next_occurrence), 'MMM d, yyyy')}
                        </td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <div className="flex items-center gap-2">
                            <span>{rt.description}</span>
                            <Badge variant="outline" className="ml-2">
                              <ArrowPathIcon className="h-3 w-3 mr-1" />
                              {rt.frequency}
                            </Badge>
                            <Badge variant={rt.active ? 'success' : 'secondary'}>
                              {rt.active ? 'Active' : 'Paused'}
                            </Badge>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {getAccountName(rt.account_id)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize bg-gray-100 text-gray-800">
                            {categories.find(c => c.id === rt.category_id)?.name}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium">
                              <Amount
                                value={rt.amount}
                                currency={accounts.find(a => a.id === rt.account_id)?.currency || 'USD'}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    transactions.map((transaction) => (
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
                          <div className="flex flex-col">
                            <div className="text-sm font-medium">
                              <Amount
                                value={transaction.amount}
                                currency={accounts.find(a => a.id === transaction.account_id)?.currency || 'USD'}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

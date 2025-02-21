'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition, Combobox } from '@headlessui/react'
import * as HeroIcons from '@heroicons/react/24/outline'
import { ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { supabase } from '@/lib/supabase'
import { Account, Transaction } from '@/types'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface Category {
  id: string
  name: string
  type: 'income' | 'expense' | 'transfer'
  color: string | null
  icon: string | null
}

interface AddTransactionModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  accountId?: string
  accounts: Account[]
}

const schema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  type: z.enum(['income', 'expense', 'transfer'] as const),
  account_id: z.string().min(1, 'Account is required'),
  transfer_account_id: z.string().optional(),
  category_id: z.string().optional(),
  date: z.date(),
  is_recurring: z.boolean().default(false),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const).optional(),
  end_date: z.date().optional().nullable(),
  day_of_month: z.number().min(1).max(31).optional(),
  day_of_week: z.number().min(0).max(6).optional(),
  week_of_month: z.number().min(1).max(5).optional()
})

type FormData = z.infer<typeof schema>

// Group categories by their group (based on name)
const groupCategories = (categories: Category[]) => {
  const groups: { [key: string]: Category[] } = {}
  
  categories.forEach(category => {
    let group = 'Other'
    
    if (category.type === 'income') {
      group = 'Income'
    } else {
      // Extract group from category name
      if (category.name.includes('Rent') || category.name.includes('Utilities') || category.name.includes('Home')) {
        group = 'Housing & Utilities'
      } else if (category.name.includes('Fuel') || category.name.includes('Transport') || category.name.includes('Car') || category.name.includes('Parking')) {
        group = 'Transportation'
      } else if (category.name.includes('Groceries') || category.name.includes('Restaurant') || category.name.includes('Coffee')) {
        group = 'Food & Dining'
      } else if (category.name.includes('Clothing') || category.name.includes('Electronics')) {
        group = 'Shopping'
      } else if (category.name.includes('Healthcare') || category.name.includes('Pharmacy') || category.name.includes('Fitness')) {
        group = 'Health & Wellness'
      } else if (category.name.includes('Movies') || category.name.includes('Games') || category.name.includes('Hobbies')) {
        group = 'Entertainment'
      } else if (category.name.includes('Books') || category.name.includes('Courses') || category.name.includes('Software')) {
        group = 'Education'
      } else if (category.name.includes('Insurance') || category.name.includes('Taxes') || category.name.includes('Bank') || category.name === 'Investments') {
        group = 'Financial'
      } else if (category.name.includes('Hair') || category.name.includes('Beauty') || category.name.includes('Spa') || category.name.includes('Personal Care')) {
        group = 'Personal Care'
      } else if (category.name.includes('Gifts') || category.name.includes('Charity') || category.name.includes('Other')) {
        group = 'Miscellaneous'
      }
    }
    
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(category)
  })
  
  // Sort categories within each group
  Object.keys(groups).forEach(group => {
    groups[group].sort((a, b) => a.name.localeCompare(b.name))
  })
  
  return groups
}

// Component to render a category option with icon
function CategoryOption({ category, className = '' }: { category: Category, className?: string }) {
  // Convert icon name to the actual icon component
  const IconComponent = category.icon ? (HeroIcons as any)[category.icon.charAt(0).toUpperCase() + category.icon.slice(1) + 'Icon'] : null

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {IconComponent && (
        <IconComponent
          className="h-4 w-4 flex-shrink-0"
          style={{ color: category.color || '#6B7280' }}
        />
      )}
      <span className="truncate">{category.name}</span>
    </div>
  )
}

export function AddTransactionModal({
  open,
  onClose,
  onSuccess,
  accountId,
  accounts,
}: AddTransactionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRecurring, setIsRecurring] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedType, setSelectedType] = useState<'income' | 'expense' | 'transfer'>('expense')
  const [query, setQuery] = useState('')
  
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'expense',
      date: new Date(),
      is_recurring: false,
      account_id: accountId || '',
    },
  })

  // Fetch categories when type changes
  useEffect(() => {
    if (open && selectedType) {
      console.log('Fetching categories due to type change:', selectedType)
      fetchCategories()
    }
  }, [selectedType, open])

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories for type:', selectedType)

      const systemUserId = '00000000-0000-0000-0000-000000000000'

      // Get all categories for the selected type
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .eq('type', selectedType)
        .eq('is_active', true)
        .eq('user_id', systemUserId)
        .order('name')

      if (error) {
        console.error('Error fetching categories:', error)
        return
      }

      console.log('Categories found:', categories?.length || 0, categories)
      setCategories(categories || [])
    } catch (error) {
      console.error('Error in fetchCategories:', error)
    }
  }

  const transactionType = watch('type')
  const isRecurringWatch = watch('is_recurring')

  // Filter categories based on search query
  const filteredCategories = query === ''
    ? categories
    : categories.filter((category) =>
        category.name
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(query.toLowerCase().replace(/\s+/g, ''))
      )

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      setError(null)

      if (data.is_recurring) {
        const {
          date,
          is_recurring,
          frequency,
          end_date,
          day_of_month,
          day_of_week,
          week_of_month,
          transfer_account_id,
          category_id,
          ...rest
        } = data

        if (!frequency) {
          console.error('Frequency is required for recurring transactions')
          return
        }

        await supabase.from('recurring_transactions').insert({
          ...rest,
          start_date: date.toISOString(),
          end_date: end_date?.toISOString() || null,
          frequency,
          transfer_account_id: transfer_account_id || null,
          category_id: category_id || null,
          day_of_month: day_of_month || null,
          day_of_week: day_of_week || null,
          week_of_month: week_of_month || null
        })
      } else {
        const { date, is_recurring, frequency, end_date, day_of_month, day_of_week, week_of_month, ...rest } = data
        await supabase.from('transactions').insert({
          ...rest,
          date: date.toISOString()
        })
      }
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating transaction:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly (every 3 months)' },
    { value: 'yearly', label: 'Yearly' }
  ]

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <HeroIcons.XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Add Transaction
                    </Dialog.Title>

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                      {/* Transaction Type */}
                      <div>
                        <label
                          htmlFor="type"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Type
                        </label>
                        <select
                          id="type"
                          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                          {...register('type')}
                          onChange={(e) => {
                            const newType = e.target.value as 'income' | 'expense' | 'transfer'
                            setSelectedType(newType)
                            setValue('type', newType)
                            setValue('category_id', '') // Reset category when type changes
                          }}
                        >
                          <option value="income">Income</option>
                          <option value="expense">Expense</option>
                          <option value="transfer">Transfer</option>
                        </select>
                      </div>

                      {/* Amount */}
                      <div>
                        <label
                          htmlFor="amount"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Amount
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            id="amount"
                            step="0.01"
                            min="0"
                            required
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            {...register('amount', { valueAsNumber: true })}
                          />
                          {errors.amount && (
                            <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label
                          htmlFor="description"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Description
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            id="description"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            {...register('description')}
                          />
                          {errors.description && (
                            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Date */}
                      <div>
                        <label
                          htmlFor="date"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Date
                        </label>
                        <div className="mt-1">
                          <input
                            type="date"
                            id="date"
                            required
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            {...register('date')}
                          />
                        </div>
                      </div>

                      {/* Account */}
                      <div>
                        <label
                          htmlFor="account_id"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Account
                        </label>
                        <select
                          id="account_id"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                          {...register('account_id')}
                        >
                          <option value="">Select an account</option>
                          {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Category */}
                      {selectedType !== 'transfer' && (
                        <div className="relative">
                          <label
                            htmlFor="category_id"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Category
                          </label>
                          <select
                            id="category_id"
                            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                            {...register('category_id')}
                          >
                            <option value="">Select a category</option>
                            {Object.entries(groupCategories(categories)).map(([group, groupCategories]) => (
                              <optgroup key={group} label={group}>
                                {groupCategories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                      )}
                      {/* Recurring Transaction Toggle */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          {...register('is_recurring')}
                        />
                        <label
                          htmlFor="is_recurring"
                          className="text-sm font-medium text-gray-700"
                        >
                          Make this a recurring transaction
                        </label>
                      </div>

                      {/* Recurring Transaction Options */}
                      {isRecurringWatch && (
                        <>
                          {/* Frequency */}
                          <div>
                            <label
                              htmlFor="frequency"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Frequency
                            </label>
                            <select
                              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                              {...register('frequency')}
                            >
                              <option value="">Select frequency</option>
                              {frequencies.map((freq) => (
                                <option key={freq.value} value={freq.value}>
                                  {freq.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* End Date */}
                          <div>
                            <label
                              htmlFor="end_date"
                              className="block text-sm font-medium text-gray-700"
                            >
                              End Date (Optional)
                            </label>
                            <input
                              type="date"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              {...register('end_date')}
                            />
                          </div>

                          {/* Additional Recurring Options based on Frequency */}
                          {watch('frequency') === 'monthly' && (
                            <div>
                              <label
                                htmlFor="day_of_month"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Day of Month
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="31"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                {...register('day_of_month', { valueAsNumber: true })}
                              />
                            </div>
                          )}

                          {watch('frequency') === 'weekly' && (
                            <div>
                              <label
                                htmlFor="day_of_week"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Day of Week
                              </label>
                              <select
                                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                {...register('day_of_week', { valueAsNumber: true })}
                              >
                                <option value="">Select day</option>
                                <option value="0">Sunday</option>
                                <option value="1">Monday</option>
                                <option value="2">Tuesday</option>
                                <option value="3">Wednesday</option>
                                <option value="4">Thursday</option>
                                <option value="5">Friday</option>
                                <option value="6">Saturday</option>
                              </select>
                            </div>
                          )}
                        </>
                      )}

                      {error && (
                        <div className="rounded-md bg-red-50 p-4">
                          <div className="flex">
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">
                                Error
                              </h3>
                              <div className="mt-2 text-sm text-red-700">
                                {error}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:ml-3 sm:w-auto disabled:opacity-50"
                        >
                          {loading ? 'Adding...' : 'Add Transaction'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

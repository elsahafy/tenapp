import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useUser } from '@/lib/hooks/useUser'
import { Database } from '@/lib/types/database'
import {
  RecurringTransaction,
  RecurringFrequency,
  createRecurringTransaction,
  updateRecurringTransaction,
} from '@/lib/services/recurringTransactionService'
import { supabase } from '@/lib/supabase'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  transaction?: RecurringTransaction
}

interface FormData {
  id?: string
  description: string
  amount: number
  type: 'deposit' | 'withdrawal'
  category_id: string | null
  account_id: string | null
  frequency: string
  day_of_week: number | null
  day_of_month: number | null
  start_date: string
  end_date: string | null
  active: boolean
  created_at?: string
  updated_at?: string
}

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
] as const

const defaultFormData: FormData = {
  id: undefined,
  description: '',
  amount: 0,
  type: 'withdrawal',
  category_id: null,
  account_id: null,
  frequency: 'monthly',
  day_of_week: null,
  day_of_month: null,
  start_date: new Date().toISOString().split('T')[0],
  end_date: null,
  active: true,
  created_at: undefined,
  updated_at: undefined
}

export default function RecurringTransactionModal({
  open,
  onClose,
  onSuccess,
  transaction,
}: Props) {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [formData, setFormData] = useState<FormData>(defaultFormData)

  useEffect(() => {
    if (transaction) {
      setFormData({
        id: transaction.id,
        description: transaction.description || '',
        amount: transaction.amount,
        type: transaction.type === 'transfer' ? 'withdrawal' : transaction.type,
        category_id: transaction.category_id,
        account_id: transaction.account_id,
        frequency: transaction.frequency,
        day_of_week: transaction.day_of_week || null,
        day_of_month: transaction.day_of_month || null,
        start_date: transaction.start_date,
        end_date: transaction.end_date || null,
        active: transaction.active ?? true,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at
      })
    } else {
      setFormData(defaultFormData)
    }
  }, [transaction])

  useEffect(() => {
    if (!user?.id) return

    const fetchData = async () => {
      try {
        const [categoriesResponse, accountsResponse] = await Promise.all([
          supabase
            .from('categories')
            .select('id, name, type')
            .eq('user_id', user.id)
            .order('name'),
          supabase
            .from('accounts')
            .select('id, name')
            .eq('user_id', user.id)
            .order('name'),
        ])

        if (categoriesResponse.error) throw categoriesResponse.error
        if (accountsResponse.error) throw accountsResponse.error

        setCategories(categoriesResponse.data || [])
        setAccounts(accountsResponse.data || [])
      } catch (error) {
        console.error('Error fetching form data:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      }
    }

    fetchData()
  }, [user?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError(null)

      const payload = {
        ...formData,
        user_id: user?.id,
        amount: Number(formData.amount),
        day_of_month: formData.day_of_month || null,
      }

      if (transaction) {
        // Update existing
        await supabase
          .from('recurring_transactions')
          .update(payload)
          .eq('id', transaction.id)
      } else {
        // Create new
        await supabase
          .from('recurring_transactions')
          .insert([payload])
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDayOfMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : null
    setFormData(prev => ({
      ...prev,
      day_of_month: value
    }))
  }

  const handleDayOfWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? parseInt(e.target.value, 10) : null
    setFormData(prev => ({
      ...prev,
      day_of_week: value
    }))
  }

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
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      {transaction
                        ? 'Edit Recurring Transaction'
                        : 'New Recurring Transaction'}
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="mt-4">
                      <div className="space-y-4">
                        {/* Description */}
                        <div>
                          <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Description
                          </label>
                          <input
                            type="text"
                            name="description"
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        </div>

                        {/* Amount and Type */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="amount"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Amount
                            </label>
                            <input
                              type="number"
                              id="amount"
                              step="0.01"
                              min="0"
                              required
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              value={formData.amount}
                              onChange={(e) =>
                                setFormData(prev => ({
                                  ...prev,
                                  amount: e.target.value === '' ? 0 : Number(e.target.value),
                                }))
                              }
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="type"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Type
                            </label>
                            <select
                              id="type"
                              name="type"
                              value={formData.type}
                              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'deposit' | 'withdrawal' })}
                              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                            >
                              <option value="withdrawal">Expense</option>
                              <option value="deposit">Income</option>
                            </select>
                          </div>
                        </div>

                        {/* Category and Account */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="category"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Category
                            </label>
                            <select
                              id="category"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              value={formData.category_id || ''}
                              onChange={(e) =>
                                setFormData(prev => ({
                                  ...prev,
                                  category_id: e.target.value || null,
                                }))
                              }
                            >
                              <option value="">Select category</option>
                              {categories
                                .filter(
                                  (cat) =>
                                    cat.type === formData.type ||
                                    cat.type === 'both'
                                )
                                .map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div>
                            <label
                              htmlFor="account"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Account
                            </label>
                            <select
                              id="account"
                              required
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              value={formData.account_id || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  account_id: e.target.value || null,
                                })
                              }
                            >
                              <option value="">Select account</option>
                              {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                  {account.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Frequency */}
                        <div>
                          <label
                            htmlFor="frequency"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Frequency
                          </label>
                          <select
                            id="frequency"
                            value={formData.frequency}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                frequency: e.target.value,
                                // Reset related fields when frequency changes
                                day_of_week: null,
                                day_of_month: null,
                              })
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            {frequencyOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Day of Month */}
                        {formData.frequency === 'monthly' && (
                          <div>
                            <label
                              htmlFor="dayOfMonth"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Day of Month
                            </label>
                            <input
                              type="number"
                              id="dayOfMonth"
                              min="1"
                              max="31"
                              value={formData.day_of_month || ''}
                              onChange={handleDayOfMonthChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                          </div>
                        )}

                        {/* Day of Week */}
                        {formData.frequency === 'weekly' && (
                          <div>
                            <label
                              htmlFor="dayOfWeek"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Day of Week
                            </label>
                            <select
                              id="dayOfWeek"
                              value={formData.day_of_week?.toString() || ''}
                              onChange={handleDayOfWeekChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="start_date"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Start Date
                            </label>
                            <input
                              type="date"
                              id="start_date"
                              value={formData.start_date}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  start_date: e.target.value,
                                })
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="end_date"
                              className="block text-sm font-medium text-gray-700"
                            >
                              End Date (Optional)
                            </label>
                            <input
                              type="date"
                              id="end_date"
                              value={formData.end_date || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  end_date: e.target.value || null,
                                })
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="active"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={formData.active}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                active: e.target.checked,
                              })
                            }
                          />
                          <label
                            htmlFor="active"
                            className="ml-2 block text-sm text-gray-900"
                          >
                            Active
                          </label>
                        </div>

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
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:ml-3 sm:w-auto"
                        >
                          {loading ? 'Saving...' : 'Save'}
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

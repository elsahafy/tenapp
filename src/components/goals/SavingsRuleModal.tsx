import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useUser } from '@/lib/hooks/useUser'
import {
  SavingsRule,
  createSavingsRule,
  updateSavingsRule,
} from '@/lib/services/savingsRuleService'
import { getGoals } from '@/lib/services/goalService'
import { supabase } from '@/lib/supabase'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  rule?: SavingsRule
}

export default function SavingsRuleModal({
  open,
  onClose,
  onSuccess,
  rule,
}: Props) {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: '',
    type: 'fixed',
    amount: '',
    frequency: 'monthly',
    goal_id: '',
    source_account_id: '',
    condition_type: 'always',
    condition_value: '',
    active: true,
  })

  useEffect(() => {
    if (!user?.id) return

    const fetchData = async () => {
      try {
        const [goalsResponse, accountsResponse] = await Promise.all([
          getGoals(user.id),
          supabase
            .from('accounts')
            .select('id, name, balance')
            .eq('user_id', user.id)
            .order('name'),
        ])

        if (accountsResponse.error) throw accountsResponse.error

        setGoals(goalsResponse)
        setAccounts(accountsResponse.data || [])
      } catch (error) {
        console.error('Error fetching form data:', error)
        setError(error instanceof Error ? error.message : 'An error occurred')
      }
    }

    fetchData()
  }, [user?.id])

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        type: rule.type,
        amount: rule.amount.toString(),
        frequency: rule.frequency,
        goal_id: rule.goal_id,
        source_account_id: rule.source_account_id,
        condition_type: rule.condition_type || 'always',
        condition_value: rule.condition_value?.toString() || '',
        active: rule.active,
      })
    }
  }, [rule])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      const data = {
        name: formData.name,
        type: formData.type as 'percentage' | 'fixed',
        amount: parseFloat(formData.amount),
        frequency: formData.frequency as 'daily' | 'weekly' | 'monthly',
        goal_id: formData.goal_id,
        source_account_id: formData.source_account_id,
        condition_type:
          formData.condition_type === 'always'
            ? null
            : (formData.condition_type as 'balance_above' | 'income_received'),
        condition_value:
          formData.condition_type === 'balance_above'
            ? parseFloat(formData.condition_value)
            : null,
        active: formData.active,
      }

      if (rule) {
        await updateSavingsRule(rule.id, data)
      } else {
        await createSavingsRule(user.id, data)
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving savings rule:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
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
                      {rule ? 'Edit Savings Rule' : 'New Savings Rule'}
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="mt-4">
                      <div className="space-y-4">
                        {/* Name */}
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Rule Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>

                        {/* Type and Amount */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="type"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Type
                            </label>
                            <select
                              id="type"
                              required
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              value={formData.type}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  type: e.target.value as 'fixed' | 'percentage',
                                })
                              }
                            >
                              <option value="fixed">Fixed Amount</option>
                              <option value="percentage">Percentage</option>
                            </select>
                          </div>
                          <div>
                            <label
                              htmlFor="amount"
                              className="block text-sm font-medium text-gray-700"
                            >
                              {formData.type === 'fixed' ? 'Amount' : 'Percentage'}
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 sm:text-sm">
                                  {formData.type === 'fixed' ? '$' : '%'}
                                </span>
                              </div>
                              <input
                                type="number"
                                id="amount"
                                required
                                step={formData.type === 'fixed' ? '0.01' : '0.1'}
                                min="0"
                                max={formData.type === 'percentage' ? '100' : undefined}
                                className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                value={formData.amount}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    amount: e.target.value,
                                  })
                                }
                              />
                            </div>
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
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={formData.frequency}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                frequency: e.target.value as
                                  | 'daily'
                                  | 'weekly'
                                  | 'monthly',
                              })
                            }
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>

                        {/* Goal and Account */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="goal"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Goal
                            </label>
                            <select
                              id="goal"
                              required
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              value={formData.goal_id}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  goal_id: e.target.value,
                                })
                              }
                            >
                              <option value="">Select goal</option>
                              {goals.map((goal) => (
                                <option key={goal.id} value={goal.id}>
                                  {goal.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label
                              htmlFor="account"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Source Account
                            </label>
                            <select
                              id="account"
                              required
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              value={formData.source_account_id}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  source_account_id: e.target.value,
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

                        {/* Conditions */}
                        <div className="space-y-4">
                          <div>
                            <label
                              htmlFor="condition_type"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Condition
                            </label>
                            <select
                              id="condition_type"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              value={formData.condition_type}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  condition_type: e.target.value,
                                  condition_value:
                                    e.target.value === 'balance_above'
                                      ? formData.condition_value
                                      : '',
                                })
                              }
                            >
                              <option value="always">Always</option>
                              <option value="balance_above">
                                When balance is above
                              </option>
                              <option value="income_received">
                                When income is received
                              </option>
                            </select>
                          </div>

                          {formData.condition_type === 'balance_above' && (
                            <div>
                              <label
                                htmlFor="condition_value"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Minimum Balance
                              </label>
                              <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                  <span className="text-gray-500 sm:text-sm">
                                    $
                                  </span>
                                </div>
                                <input
                                  type="number"
                                  id="condition_value"
                                  required
                                  step="0.01"
                                  min="0"
                                  className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                  value={formData.condition_value}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      condition_value: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
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

'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase-client'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row']
type AccountType = Database['public']['Enums']['account_type']
type CurrencyCode = Database['public']['Enums']['currency_code']

interface EditAccountModalProps {
  isOpen: boolean
  account?: Account
  onClose: () => void
  onSave: () => Promise<void>
}

export function EditAccountModal({
  isOpen,
  account,
  onClose,
  onSave,
}: EditAccountModalProps) {
  const [name, setName] = useState(account?.name ?? '')
  const [type, setType] = useState<AccountType>(account?.type ?? 'checking')
  const [currency, setCurrency] = useState<CurrencyCode>(account?.currency ?? 'AED')
  const [currentBalance, setCurrentBalance] = useState(account?.current_balance?.toString() ?? '0')
  const [creditLimit, setCreditLimit] = useState(account?.credit_limit?.toString() ?? '')
  const [interestRate, setInterestRate] = useState(account?.interest_rate?.toString() ?? '')
  const [dueDate, setDueDate] = useState(account?.due_date?.toString() ?? '')
  const [minPaymentAmount, setMinPaymentAmount] = useState(account?.min_payment_amount?.toString() ?? '')
  const [minPaymentPercentage, setMinPaymentPercentage] = useState(account?.min_payment_percentage?.toString() ?? '')
  const [emiEnabled, setEmiEnabled] = useState(account?.emi_enabled ?? false)
  const [institution, setInstitution] = useState(account?.institution ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          name,
          type,
          currency,
          current_balance: parseFloat(currentBalance),
          credit_limit: creditLimit ? parseFloat(creditLimit) : null,
          interest_rate: interestRate ? parseFloat(interestRate) : null,
          due_date: dueDate ? parseInt(dueDate) : null,
          min_payment_amount: minPaymentAmount ? parseFloat(minPaymentAmount) : null,
          min_payment_percentage: minPaymentPercentage ? parseFloat(minPaymentPercentage) : null,
          emi_enabled: type === 'credit_card' ? emiEnabled : false,
          institution: institution || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', account?.id)

      if (updateError) throw updateError
      await onSave()
      onClose()
    } catch (err) {
      console.error('Update account error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Edit Account
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Account Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                          Account Type
                        </label>
                        <select
                          id="type"
                          name="type"
                          value={type}
                          onChange={(e) => setType(e.target.value as AccountType)}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="checking">Checking</option>
                          <option value="savings">Savings</option>
                          <option value="credit_card">Credit Card</option>
                          <option value="investment">Investment</option>
                          <option value="loan">Loan</option>
                          <option value="cash">Cash</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                          Currency
                        </label>
                        <select
                          id="currency"
                          name="currency"
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="AED">AED</option>
                          <option value="SAR">SAR</option>
                          <option value="QAR">QAR</option>
                          <option value="BHD">BHD</option>
                          <option value="KWD">KWD</option>
                          <option value="OMR">OMR</option>
                          <option value="EGP">EGP</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="currentBalance" className="block text-sm font-medium text-gray-700">
                          Current Balance
                        </label>
                        <input
                          type="number"
                          name="currentBalance"
                          id="currentBalance"
                          value={currentBalance}
                          onChange={(e) => setCurrentBalance(e.target.value)}
                          required
                          step="0.01"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      {type === 'credit_card' && (
                        <>
                          <div>
                            <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700">
                              Credit Limit
                            </label>
                            <input
                              type="number"
                              name="creditLimit"
                              id="creditLimit"
                              value={creditLimit}
                              onChange={(e) => setCreditLimit(e.target.value)}
                              step="0.01"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700">
                              Interest Rate (% APR)
                            </label>
                            <input
                              type="number"
                              name="interestRate"
                              id="interestRate"
                              value={interestRate}
                              onChange={(e) => setInterestRate(e.target.value)}
                              step="0.01"
                              min="0"
                              max="100"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="minPaymentAmount" className="block text-sm font-medium text-gray-700">
                                Minimum Payment Amount
                              </label>
                              <input
                                type="number"
                                name="minPaymentAmount"
                                id="minPaymentAmount"
                                value={minPaymentAmount}
                                onChange={(e) => setMinPaymentAmount(e.target.value)}
                                step="0.01"
                                min="0"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label htmlFor="minPaymentPercentage" className="block text-sm font-medium text-gray-700">
                                Minimum Payment (%)
                              </label>
                              <input
                                type="number"
                                name="minPaymentPercentage"
                                id="minPaymentPercentage"
                                value={minPaymentPercentage}
                                onChange={(e) => setMinPaymentPercentage(e.target.value)}
                                step="0.01"
                                min="0"
                                max="100"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                              Due Date (Day of Month)
                            </label>
                            <input
                              type="number"
                              name="dueDate"
                              id="dueDate"
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                              min="1"
                              max="31"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            />
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              name="emiEnabled"
                              id="emiEnabled"
                              checked={emiEnabled}
                              onChange={(e) => setEmiEnabled(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="emiEnabled" className="ml-2 block text-sm text-gray-700">
                              Enable EMI (Equated Monthly Installment)
                            </label>
                          </div>
                        </>
                      )}

                      <div>
                        <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                          Institution
                        </label>
                        <input
                          type="text"
                          name="institution"
                          id="institution"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      {error && (
                        <div className="rounded-md bg-red-50 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:ml-3 sm:w-auto"
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
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

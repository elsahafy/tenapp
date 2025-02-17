'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row']
type AccountType = Database['public']['Enums']['account_type']
type CurrencyCode = Database['public']['Enums']['currency_code']

type EditAccountModalProps = {
  isOpen: boolean
  account: Account
  onClose: () => void
  onSave: () => Promise<void>
}

export function EditAccountModal({
  isOpen,
  account,
  onClose,
  onSave,
}: EditAccountModalProps) {
  const [name, setName] = useState(account.name)
  const [type, setType] = useState<AccountType>(account.type)
  const [currency, setCurrency] = useState<CurrencyCode>(account.currency)
  const [currentBalance, setCurrentBalance] = useState(account.current_balance.toString())
  const [creditLimit, setCreditLimit] = useState(account.credit_limit?.toString() || '')
  const [interestRate, setInterestRate] = useState(account.interest_rate?.toString() || '')
  const [dueDate, setDueDate] = useState(account.due_date?.toString() || '')
  const [institution, setInstitution] = useState(account.institution || '')
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
          institution: institution || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id)

      if (updateError) throw updateError

      await onSave()
      onClose()
    } catch (err) {
      console.error('Error updating account:', err)
      setError('Failed to update account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={onClose}
      >
        <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <span
            className="hidden sm:inline-block sm:h-screen sm:align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Edit Account
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {error && (
                      <div className="rounded-md bg-red-50 p-4">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Account Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="type"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Account Type
                      </label>
                      <select
                        id="type"
                        name="type"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={type}
                        onChange={(e) => setType(e.target.value as AccountType)}
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
                      <label
                        htmlFor="currency"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Currency
                      </label>
                      <select
                        id="currency"
                        name="currency"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="AED">AED - UAE Dirham</option>
                        <option value="SAR">SAR - Saudi Riyal</option>
                        <option value="QAR">QAR - Qatari Riyal</option>
                        <option value="BHD">BHD - Bahraini Dinar</option>
                        <option value="KWD">KWD - Kuwaiti Dinar</option>
                        <option value="OMR">OMR - Omani Rial</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="currentBalance"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Current Balance
                      </label>
                      <input
                        type="number"
                        name="currentBalance"
                        id="currentBalance"
                        required
                        step="0.01"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={currentBalance}
                        onChange={(e) => setCurrentBalance(e.target.value)}
                      />
                    </div>

                    {(type === 'credit_card' || type === 'loan') && (
                      <>
                        <div>
                          <label
                            htmlFor="creditLimit"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Credit Limit
                          </label>
                          <input
                            type="number"
                            name="creditLimit"
                            id="creditLimit"
                            step="0.01"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={creditLimit}
                            onChange={(e) => setCreditLimit(e.target.value)}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="interestRate"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Interest Rate (%)
                          </label>
                          <input
                            type="number"
                            name="interestRate"
                            id="interestRate"
                            step="0.01"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={interestRate}
                            onChange={(e) => setInterestRate(e.target.value)}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="dueDate"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Due Date (Day of Month)
                          </label>
                          <input
                            type="number"
                            name="dueDate"
                            id="dueDate"
                            min="1"
                            max="31"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label
                        htmlFor="institution"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Institution (Optional)
                      </label>
                      <input
                        type="text"
                        name="institution"
                        id="institution"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                      />
                    </div>

                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

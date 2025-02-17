'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase-client'
import type { Database } from '@/lib/database.types'

type AccountType = Database['public']['Enums']['account_type']
type CurrencyCode = Database['public']['Enums']['currency_code']

interface AddAccountModalProps {
  onClose: () => void
  onAdd: () => void
}

const accountTypes: AccountType[] = [
  'checking',
  'savings',
  'credit_card',
  'investment',
  'loan',
  'cash',
]

const currencies: CurrencyCode[] = [
  'USD',
  'EUR',
  'GBP',
  'AED',
  'SAR',
  'QAR',
  'BHD',
  'KWD',
  'OMR',
]

export function AddAccountModal({ onClose, onAdd }: AddAccountModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('checking')
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [currentBalance, setCurrentBalance] = useState('0')
  const [creditLimit, setCreditLimit] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [institution, setInstitution] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { error } = await supabase.from('accounts').insert({
        name,
        type,
        currency,
        current_balance: parseFloat(currentBalance),
        credit_limit: creditLimit ? parseFloat(creditLimit) : null,
        interest_rate: interestRate ? parseFloat(interestRate) : null,
        due_date: dueDate ? parseInt(dueDate) : null,
        institution: institution || null,
        user_id: user.id,
      })

      if (error) throw error

      onAdd()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Transition.Root show={true} as={Fragment}>
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
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Add New Account
                    </Dialog.Title>
                    <div className="mt-2">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Account Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            required
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
                            value={type}
                            onChange={(e) => setType(e.target.value as AccountType)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            {accountTypes.map((type) => (
                              <option key={type} value={type}>
                                {type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                              </option>
                            ))}
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
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          >
                            {currencies.map((code) => (
                              <option key={code} value={code}>
                                {code}
                              </option>
                            ))}
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
                            id="currentBalance"
                            value={currentBalance}
                            onChange={(e) => setCurrentBalance(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            required
                            step="0.01"
                          />
                        </div>

                        {type === 'credit_card' && (
                          <div>
                            <label
                              htmlFor="creditLimit"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Credit Limit
                            </label>
                            <input
                              type="number"
                              id="creditLimit"
                              value={creditLimit}
                              onChange={(e) => setCreditLimit(e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              step="0.01"
                            />
                          </div>
                        )}

                        {(type === 'credit_card' || type === 'loan') && (
                          <div>
                            <label
                              htmlFor="interestRate"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Interest Rate (%)
                            </label>
                            <input
                              type="number"
                              id="interestRate"
                              value={interestRate}
                              onChange={(e) => setInterestRate(e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              step="0.01"
                            />
                          </div>
                        )}

                        {(type === 'credit_card' || type === 'loan') && (
                          <div>
                            <label
                              htmlFor="dueDate"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Due Date (Day of Month)
                            </label>
                            <input
                              type="number"
                              id="dueDate"
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              min="1"
                              max="31"
                            />
                          </div>
                        )}

                        <div>
                          <label
                            htmlFor="institution"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Institution
                          </label>
                          <input
                            type="text"
                            id="institution"
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        </div>

                        {error && (
                          <p className="mt-2 text-sm text-red-600">{error}</p>
                        )}

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 sm:ml-3 sm:w-auto"
                          >
                            {loading ? 'Adding...' : 'Add Account'}
                          </button>
                          <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
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

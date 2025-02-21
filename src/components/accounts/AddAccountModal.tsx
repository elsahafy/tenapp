'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type AccountType = Database['public']['Enums']['account_type']
type CurrencyCode = Database['public']['Enums']['currency_code']

interface AddAccountModalProps {
  isOpen: boolean
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

export function AddAccountModal({ isOpen, onClose, onAdd }: AddAccountModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('checking')
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [currentBalance, setCurrentBalance] = useState('0')
  const [creditLimit, setCreditLimit] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [institution, setInstitution] = useState('')
  const [loanTerm, setLoanTerm] = useState('')
  const [loanStartDate, setLoanStartDate] = useState('')
  const [loanEndDate, setLoanEndDate] = useState('')
  const [totalLoanAmount, setTotalLoanAmount] = useState('')
  const [monthlyInstallment, setMonthlyInstallment] = useState('')
  const [emiEnabled, setEmiEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('')
      setType('checking')
      setCurrency('USD')
      setCurrentBalance('0')
      setCreditLimit('')
      setInterestRate('')
      setDueDate('')
      setInstitution('')
      setLoanTerm('')
      setLoanStartDate('')
      setLoanEndDate('')
      setTotalLoanAmount('')
      setMonthlyInstallment('')
      setEmiEnabled(false)
      setError('')
    }
  }, [isOpen])

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
        loan_term: type === 'loan' ? (loanTerm ? parseInt(loanTerm) : null) : null,
        loan_start_date: type === 'loan' ? loanStartDate || null : null,
        loan_end_date: type === 'loan' ? loanEndDate || null : null,
        total_loan_amount: type === 'loan' ? (totalLoanAmount ? parseFloat(totalLoanAmount) : null) : null,
        monthly_installment: type === 'loan' ? (monthlyInstallment ? parseFloat(monthlyInstallment) : null) : null,
        emi_enabled: type === 'loan' ? emiEnabled : false,
        user_id: user.id,
      })

      if (error) throw error

      onAdd()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
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

                        {type === 'loan' && (
                          <>
                            <div>
                              <label
                                htmlFor="loanTerm"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Loan Term (months)
                              </label>
                              <input
                                type="number"
                                id="loanTerm"
                                value={loanTerm}
                                onChange={(e) => setLoanTerm(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                min="1"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="totalLoanAmount"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Total Loan Amount
                              </label>
                              <input
                                type="number"
                                id="totalLoanAmount"
                                value={totalLoanAmount}
                                onChange={(e) => setTotalLoanAmount(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                step="0.01"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="monthlyInstallment"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Monthly Installment
                              </label>
                              <input
                                type="number"
                                id="monthlyInstallment"
                                value={monthlyInstallment}
                                onChange={(e) => setMonthlyInstallment(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                step="0.01"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="loanStartDate"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Loan Start Date
                              </label>
                              <input
                                type="date"
                                id="loanStartDate"
                                value={loanStartDate}
                                onChange={(e) => setLoanStartDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="loanEndDate"
                                className="block text-sm font-medium text-gray-700"
                              >
                                Loan End Date
                              </label>
                              <input
                                type="date"
                                id="loanEndDate"
                                value={loanEndDate}
                                onChange={(e) => setLoanEndDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              />
                            </div>

                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="emiEnabled"
                                checked={emiEnabled}
                                onChange={(e) => setEmiEnabled(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <label
                                htmlFor="emiEnabled"
                                className="ml-2 block text-sm font-medium text-gray-700"
                              >
                                Enable EMI (Equated Monthly Installment)
                              </label>
                            </div>
                          </>
                        )}

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

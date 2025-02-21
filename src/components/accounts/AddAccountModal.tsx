'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { Tooltip } from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'

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

const loanTermDescriptions = {
  loanTerm: 'Duration of the loan in months',
  totalLoanAmount: 'Total amount borrowed, including any fees',
  monthlyInstallment: 'Fixed amount to be paid each month',
  interestRate: 'Annual interest rate as a percentage',
  emiEnabled: 'Equated Monthly Installment (EMI) ensures equal monthly payments throughout the loan term',
  startDate: 'Date when loan repayment begins',
  endDate: 'Date when loan should be fully repaid'
}

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
  const [collateral, setCollateral] = useState('')
  const [loanPurpose, setLoanPurpose] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isAutoCalculating, setIsAutoCalculating] = useState(true)

  // Calculate monthly installment when loan details change
  useEffect(() => {
    if (!isAutoCalculating || type !== 'loan') return

    const amount = parseFloat(totalLoanAmount)
    const months = parseInt(loanTerm)
    const rate = parseFloat(interestRate)

    if (!isNaN(amount) && !isNaN(months) && !isNaN(rate) && months > 0) {
      // Convert annual interest rate to monthly
      const monthlyRate = rate / 12 / 100

      // Calculate EMI using the formula: EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
      // Where P is principal, r is monthly interest rate, n is number of months
      if (emiEnabled && monthlyRate > 0) {
        const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                   (Math.pow(1 + monthlyRate, months) - 1)
        setMonthlyInstallment(emi.toFixed(2))
      } else {
        // Simple division if EMI is not enabled or no interest rate
        const simpleInstallment = amount / months
        setMonthlyInstallment(simpleInstallment.toFixed(2))
      }
    }
  }, [totalLoanAmount, loanTerm, interestRate, emiEnabled, type, isAutoCalculating])

  // Auto-calculate loan end date based on start date and term
  useEffect(() => {
    if (type !== 'loan' || !loanStartDate || !loanTerm) return

    try {
      const startDate = new Date(loanStartDate)
      const months = parseInt(loanTerm)
      
      if (!isNaN(months) && months > 0) {
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + months)
        setLoanEndDate(endDate.toISOString().split('T')[0])
      }
    } catch (error) {
      console.error('Error calculating end date:', error)
    }
  }, [loanStartDate, loanTerm, type])

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
      setCollateral('')
      setLoanPurpose('')
      setError('')
      setFieldErrors({})
      setIsAutoCalculating(true)
    }
  }, [isOpen])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // Basic validation for all account types
    if (!name.trim()) {
      errors.name = 'Account name is required'
    }
    if (isNaN(parseFloat(currentBalance))) {
      errors.currentBalance = 'Current balance must be a valid number'
    }

    // Loan-specific validation
    if (type === 'loan') {
      if (!loanTerm || isNaN(parseInt(loanTerm)) || parseInt(loanTerm) <= 0) {
        errors.loanTerm = 'Loan term must be a positive number'
      }
      if (!totalLoanAmount || isNaN(parseFloat(totalLoanAmount)) || parseFloat(totalLoanAmount) <= 0) {
        errors.totalLoanAmount = 'Total loan amount must be a positive number'
      }
      if (!monthlyInstallment || isNaN(parseFloat(monthlyInstallment)) || parseFloat(monthlyInstallment) <= 0) {
        errors.monthlyInstallment = 'Monthly installment must be a positive number'
      }
      if (!loanStartDate) {
        errors.loanStartDate = 'Loan start date is required'
      }
      if (!loanEndDate) {
        errors.loanEndDate = 'Loan end date is required'
      }
      if (loanStartDate && loanEndDate && new Date(loanStartDate) >= new Date(loanEndDate)) {
        errors.loanEndDate = 'End date must be after start date'
      }
      if (interestRate && (isNaN(parseFloat(interestRate)) || parseFloat(interestRate) < 0)) {
        errors.interestRate = 'Interest rate must be a non-negative number'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    if (!validateForm()) {
      return
    }

    setLoading(true)

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
        collateral: type === 'loan' ? collateral || null : null,
        loan_purpose: type === 'loan' ? loanPurpose || null : null,
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
      <Dialog
        as="div"
        className="relative z-10"
        onClose={onClose}
        open={isOpen}
      >
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all w-full sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
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
                  <div className="mt-3 w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900 mb-5"
                    >
                      Add Account
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
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
                            className={cn(
                              'mt-1 block w-full rounded-md shadow-sm sm:text-sm',
                              fieldErrors.name ? 'border-red-300' : 'border-gray-300'
                            )}
                          />
                          {fieldErrors.name && (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                          )}
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
                                {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

                        <div className="sm:col-span-2">
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
                            className={cn(
                              'mt-1 block w-full rounded-md shadow-sm sm:text-sm',
                              fieldErrors.currentBalance ? 'border-red-300' : 'border-gray-300'
                            )}
                            step="0.01"
                          />
                          {fieldErrors.currentBalance && (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors.currentBalance}</p>
                          )}
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
                            <div className="flex items-center justify-between">
                              <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700">
                                Interest Rate (%)
                              </label>
                              <div className="flex items-center space-x-2">
                                {type === 'loan' && (
                                  <button
                                    type="button"
                                    onClick={() => setIsAutoCalculating(!isAutoCalculating)}
                                    className="text-xs text-primary-600 hover:text-primary-500"
                                  >
                                    {isAutoCalculating ? 'Edit manually' : 'Auto-calculate'}
                                  </button>
                                )}
                                <Tooltip content={loanTermDescriptions.interestRate}>
                                  <span className="text-gray-500 text-sm cursor-help">ⓘ</span>
                                </Tooltip>
                              </div>
                            </div>
                            <input
                              type="number"
                              id="interestRate"
                              value={interestRate}
                              onChange={(e) => {
                                setInterestRate(e.target.value)
                                if (type === 'loan') {
                                  setIsAutoCalculating(false)
                                }
                              }}
                              className={cn(
                                'mt-1 block w-full rounded-md shadow-sm sm:text-sm',
                                fieldErrors.interestRate ? 'border-red-300' : 'border-gray-300'
                              )}
                              step="0.01"
                              min="0"
                            />
                            {fieldErrors.interestRate && (
                              <p className="mt-1 text-sm text-red-600">{fieldErrors.interestRate}</p>
                            )}
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
                            <div className="sm:col-span-2">
                              <div className="flex items-center justify-between">
                                <label htmlFor="totalLoanAmount" className="block text-sm font-medium text-gray-700">
                                  Total Loan Amount
                                </label>
                                <Tooltip content={loanTermDescriptions.totalLoanAmount}>
                                  <span className="text-gray-500 text-sm cursor-help">ⓘ</span>
                                </Tooltip>
                              </div>
                              <input
                                type="number"
                                id="totalLoanAmount"
                                value={totalLoanAmount}
                                onChange={(e) => {
                                  setTotalLoanAmount(e.target.value)
                                  setIsAutoCalculating(true)
                                }}
                                className={cn(
                                  'mt-1 block w-full rounded-md shadow-sm sm:text-sm',
                                  fieldErrors.totalLoanAmount ? 'border-red-300' : 'border-gray-300'
                                )}
                                step="0.01"
                              />
                              {fieldErrors.totalLoanAmount && (
                                <p className="mt-1 text-sm text-red-600">{fieldErrors.totalLoanAmount}</p>
                              )}
                            </div>

                            <div className="sm:col-span-2">
                              <div className="flex items-center justify-between">
                                <label htmlFor="loanTerm" className="block text-sm font-medium text-gray-700">
                                  Loan Term (months)
                                </label>
                                <Tooltip content={loanTermDescriptions.loanTerm}>
                                  <span className="text-gray-500 text-sm cursor-help">ⓘ</span>
                                </Tooltip>
                              </div>
                              <input
                                type="number"
                                id="loanTerm"
                                value={loanTerm}
                                onChange={(e) => {
                                  setLoanTerm(e.target.value)
                                  setIsAutoCalculating(true)
                                }}
                                className={cn(
                                  'mt-1 block w-full rounded-md shadow-sm sm:text-sm',
                                  fieldErrors.loanTerm ? 'border-red-300' : 'border-gray-300'
                                )}
                              />
                              {fieldErrors.loanTerm && (
                                <p className="mt-1 text-sm text-red-600">{fieldErrors.loanTerm}</p>
                              )}
                            </div>

                            <div className="sm:col-span-2">
                              <div className="flex items-center justify-between">
                                <label htmlFor="monthlyInstallment" className="block text-sm font-medium text-gray-700">
                                  Monthly Installment
                                </label>
                                <Tooltip content={loanTermDescriptions.monthlyInstallment}>
                                  <span className="text-gray-500 text-sm cursor-help">ⓘ</span>
                                </Tooltip>
                              </div>
                              <input
                                type="number"
                                id="monthlyInstallment"
                                value={monthlyInstallment}
                                onChange={(e) => {
                                  setMonthlyInstallment(e.target.value)
                                  setIsAutoCalculating(false)
                                }}
                                className={cn(
                                  'mt-1 block w-full rounded-md shadow-sm sm:text-sm',
                                  fieldErrors.monthlyInstallment ? 'border-red-300' : 'border-gray-300'
                                )}
                                step="0.01"
                              />
                              {fieldErrors.monthlyInstallment && (
                                <p className="mt-1 text-sm text-red-600">{fieldErrors.monthlyInstallment}</p>
                              )}
                            </div>

                            <div className="sm:col-span-2">
                              <div className="flex items-center justify-between">
                                <label htmlFor="loanStartDate" className="block text-sm font-medium text-gray-700">
                                  Loan Start Date
                                </label>
                                <Tooltip content={loanTermDescriptions.startDate}>
                                  <span className="text-gray-500 text-sm cursor-help">ⓘ</span>
                                </Tooltip>
                              </div>
                              <input
                                type="date"
                                id="loanStartDate"
                                value={loanStartDate}
                                onChange={(e) => setLoanStartDate(e.target.value)}
                                className={cn(
                                  'mt-1 block w-full rounded-md shadow-sm sm:text-sm',
                                  fieldErrors.loanStartDate ? 'border-red-300' : 'border-gray-300'
                                )}
                              />
                              {fieldErrors.loanStartDate && (
                                <p className="mt-1 text-sm text-red-600">{fieldErrors.loanStartDate}</p>
                              )}
                            </div>

                            <div className="sm:col-span-2">
                              <div className="flex items-center justify-between">
                                <label htmlFor="loanEndDate" className="block text-sm font-medium text-gray-700">
                                  Loan End Date
                                </label>
                                <Tooltip content={loanTermDescriptions.endDate}>
                                  <span className="text-gray-500 text-sm cursor-help">ⓘ</span>
                                </Tooltip>
                              </div>
                              <input
                                type="date"
                                id="loanEndDate"
                                value={loanEndDate}
                                onChange={(e) => setLoanEndDate(e.target.value)}
                                className={cn(
                                  'mt-1 block w-full rounded-md shadow-sm sm:text-sm',
                                  fieldErrors.loanEndDate ? 'border-red-300' : 'border-gray-300'
                                )}
                              />
                              {fieldErrors.loanEndDate && (
                                <p className="mt-1 text-sm text-red-600">{fieldErrors.loanEndDate}</p>
                              )}
                            </div>

                            <div className="sm:col-span-2">
                              <label htmlFor="collateral" className="block text-sm font-medium text-gray-700">
                                Collateral
                              </label>
                              <input
                                type="text"
                                id="collateral"
                                value={collateral}
                                onChange={(e) => setCollateral(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label htmlFor="loanPurpose" className="block text-sm font-medium text-gray-700">
                                Loan Purpose
                              </label>
                              <textarea
                                id="loanPurpose"
                                value={loanPurpose}
                                onChange={(e) => setLoanPurpose(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="emiEnabled"
                                  checked={emiEnabled}
                                  onChange={(e) => {
                                    setEmiEnabled(e.target.checked)
                                    setIsAutoCalculating(true)
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div className="flex items-center space-x-2">
                                  <label htmlFor="emiEnabled" className="text-sm text-gray-700">
                                    Enable EMI
                                  </label>
                                  <Tooltip content={loanTermDescriptions.emiEnabled}>
                                    <span className="text-gray-500 text-sm cursor-help">ⓘ</span>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        {Object.entries(fieldErrors).map(([field, message]) => (
                          <p key={field} className="text-sm text-red-600 mt-1">
                            {message}
                          </p>
                        ))}

                        {error && (
                          <div className="rounded-md bg-red-50 p-4 mt-4">
                            <div className="flex">
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <div className="mt-2 text-sm text-red-700">{error}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={loading}
                          className={cn(
                            'inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto',
                            loading 
                              ? 'bg-primary-300 cursor-not-allowed'
                              : 'bg-primary-600 hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                          )}
                        >
                          {loading ? 'Adding...' : 'Add Account'}
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

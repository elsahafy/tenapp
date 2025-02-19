'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase-client'
import type { Database } from '@/types/supabase'
import { Button } from '@/components/ui/Button'

type Tables = Database['public']['Tables']
type Transaction = Tables['transactions']['Row']
type Account = Tables['accounts']['Row']
type Category = Tables['categories']['Row']
type TransactionType = Database['public']['Enums']['transaction_type']
type CurrencyCode = Database['public']['Enums']['currency_code']

interface TransactionModalProps {
  isOpen: boolean
  accounts: Account[]
  onClose: () => void
  onSave: () => Promise<void>
}

export function TransactionModal({
  isOpen,
  accounts,
  onClose,
  onSave,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount)) throw new Error('Invalid amount')

      if (type === 'transfer') {
        if (!fromAccountId || !toAccountId) {
          throw new Error('Please select both accounts for transfer')
        }
        if (fromAccountId === toAccountId) {
          throw new Error('Cannot transfer to the same account')
        }

        const fromAccount = accounts.find(a => a.id === fromAccountId)
        const toAccount = accounts.find(a => a.id === toAccountId)
        if (!fromAccount || !toAccount) throw new Error('Account not found')

        // Create withdrawal from source account
        const { error: withdrawalError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            account_id: fromAccountId,
            type: 'transfer' as const,
            amount: -parsedAmount,
            description: `Transfer to ${toAccount.name}: ${description}`,
            date,
            category_id: null,
            currency: fromAccount.currency,
            status: 'completed',
            transfer_account_id: toAccountId,
          })

        if (withdrawalError) throw withdrawalError

        // Create deposit to destination account
        const { error: depositError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            account_id: toAccountId,
            type: 'transfer' as const,
            amount: parsedAmount,
            description: `Transfer from ${fromAccount.name}: ${description}`,
            date,
            category_id: null,
            currency: toAccount.currency,
            status: 'completed',
            transfer_account_id: fromAccountId,
          })

        if (depositError) throw depositError

        // Update account balances
        const { error: fromAccountError } = await supabase
          .from('accounts')
          .update({ 
            current_balance: fromAccount.current_balance - parsedAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', fromAccountId)

        if (fromAccountError) throw fromAccountError

        const { error: toAccountError } = await supabase
          .from('accounts')
          .update({ 
            current_balance: toAccount.current_balance + parsedAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', toAccountId)

        if (toAccountError) throw toAccountError
      } else {
        if (!fromAccountId) {
          throw new Error('Please select an account')
        }

        const fromAccount = accounts.find(a => a.id === fromAccountId)
        if (!fromAccount) throw new Error('Account not found')

        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            account_id: fromAccountId,
            type: type as 'income' | 'expense',
            amount: type === 'income' ? parsedAmount : -parsedAmount,
            description,
            date,
            category_id: category || null,
            currency: fromAccount.currency,
            status: 'completed',
          })

        if (transactionError) throw transactionError

        // Update account balance
        const { error: accountError } = await supabase
          .from('accounts')
          .update({ 
            current_balance: fromAccount.current_balance + (type === 'income' ? parsedAmount : -parsedAmount),
            updated_at: new Date().toISOString()
          })
          .eq('id', fromAccountId)

        if (accountError) throw accountError
      }

      await onSave()
      onClose()
    } catch (err) {
      console.error('Error creating transaction:', err)
      setError(err instanceof Error ? err.message : 'Failed to create transaction')
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
                      Add Transaction
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                          Type
                        </label>
                        <select
                          id="type"
                          name="type"
                          value={type}
                          onChange={(e) => setType(e.target.value as TransactionType)}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="income">Income</option>
                          <option value="expense">Expense</option>
                          <option value="transfer">Transfer</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                          Amount
                        </label>
                        <input
                          type="number"
                          name="amount"
                          id="amount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                          step="0.01"
                          min="0"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <input
                          type="text"
                          name="description"
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                          Date
                        </label>
                        <input
                          type="date"
                          name="date"
                          id="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      {type === 'transfer' ? (
                        <>
                          <div>
                            <label htmlFor="fromAccount" className="block text-sm font-medium text-gray-700">
                              From Account
                            </label>
                            <select
                              id="fromAccount"
                              name="fromAccount"
                              value={fromAccountId}
                              onChange={(e) => setFromAccountId(e.target.value)}
                              required
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            >
                              <option value="">Select account</option>
                              {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                  {account.name} ({account.current_balance} {account.currency})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor="toAccount" className="block text-sm font-medium text-gray-700">
                              To Account
                            </label>
                            <select
                              id="toAccount"
                              name="toAccount"
                              value={toAccountId}
                              onChange={(e) => setToAccountId(e.target.value)}
                              required
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            >
                              <option value="">Select account</option>
                              {accounts.map((account) => (
                                <option 
                                  key={account.id} 
                                  value={account.id}
                                  disabled={account.id === fromAccountId}
                                >
                                  {account.name} ({account.current_balance} {account.currency})
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label htmlFor="account" className="block text-sm font-medium text-gray-700">
                              Account
                            </label>
                            <select
                              id="account"
                              name="account"
                              value={fromAccountId}
                              onChange={(e) => setFromAccountId(e.target.value)}
                              required
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            >
                              <option value="">Select account</option>
                              {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                  {account.name} ({account.current_balance} {account.currency})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                              Category
                            </label>
                            <select
                              id="category"
                              name="category"
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              required
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            >
                              <option value="">Select category</option>
                              {type === 'income' ? (
                                <>
                                  <option value="salary">Salary</option>
                                  <option value="investment">Investment</option>
                                  <option value="gift">Gift</option>
                                  <option value="other">Other</option>
                                </>
                              ) : (
                                <>
                                  <option value="food">Food & Dining</option>
                                  <option value="shopping">Shopping</option>
                                  <option value="transportation">Transportation</option>
                                  <option value="utilities">Bills & Utilities</option>
                                  <option value="entertainment">Entertainment</option>
                                  <option value="health">Health & Medical</option>
                                  <option value="travel">Travel</option>
                                  <option value="education">Education</option>
                                  <option value="other">Other</option>
                                </>
                              )}
                            </select>
                          </div>
                        </>
                      )}

                      {error && (
                        <div className="rounded-md bg-red-50 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg
                                className="h-5 w-5 text-red-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full sm:ml-3 sm:w-auto"
                        >
                          {loading ? 'Adding...' : 'Add Transaction'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onClose}
                          className="mt-3 w-full sm:mt-0 sm:w-auto"
                        >
                          Cancel
                        </Button>
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

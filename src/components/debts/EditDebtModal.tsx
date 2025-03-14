import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { Debt } from '@/types'

interface EditDebtModalProps {
  debt: Debt
  onClose: () => void
  onSave: () => void
}

const DEBT_TYPES = [
  'mortgage',
  'credit_card',
  'student_loan',
  'auto_loan',
  'personal',
] as const

export function EditDebtModal({ debt, onClose, onSave }: EditDebtModalProps) {
  const [name, setName] = useState(debt.name)
  const [type, setType] = useState<typeof DEBT_TYPES[number]>(
    debt.type as typeof DEBT_TYPES[number]
  )
  const [currentBalance, setCurrentBalance] = useState(
    debt.current_balance.toString()
  )
  const [interestRate, setInterestRate] = useState(
    debt.interest_rate.toString()
  )
  const [minimumPayment, setMinimumPayment] = useState(
    debt.minimum_payment.toString()
  )
  const [dueDate, setDueDate] = useState(
    new Date(debt.due_date).toISOString().split('T')[0]
  )
  const [active, setActive] = useState(debt.active)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('debts')
        .update({
          name,
          type,
          current_balance: parseFloat(currentBalance),
          interest_rate: parseFloat(interestRate),
          minimum_payment: parseFloat(minimumPayment),
          due_date: dueDate,
          active,
        })
        .eq('id', debt.id)

      if (error) throw error

      onSave()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Transition.Root show={true} as={Fragment}>
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
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900"
                    >
                      Edit Debt
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Debt Name
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
                          Type
                        </label>
                        <select
                          id="type"
                          value={type}
                          onChange={(e) =>
                            setType(e.target.value as typeof DEBT_TYPES[number])
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          {DEBT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type.replace(/([A-Z])/g, ' $1').trim()}
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
                        <div className="relative mt-1 rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="currentBalance"
                            value={currentBalance}
                            onChange={(e) => setCurrentBalance(e.target.value)}
                            className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="0.00"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="interestRate"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Interest Rate (APR)
                        </label>
                        <div className="relative mt-1 rounded-md shadow-sm">
                          <input
                            type="number"
                            id="interestRate"
                            value={interestRate}
                            onChange={(e) => setInterestRate(e.target.value)}
                            className="block w-full rounded-md border-gray-300 pr-12 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="0.00"
                            step="0.01"
                            required
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-gray-500 sm:text-sm">%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="minimumPayment"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Minimum Monthly Payment
                        </label>
                        <div className="relative mt-1 rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            id="minimumPayment"
                            value={minimumPayment}
                            onChange={(e) => setMinimumPayment(e.target.value)}
                            className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="0.00"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="dueDate"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Payment Due Date
                        </label>
                        <input
                          type="date"
                          id="dueDate"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div className="relative flex items-start">
                        <div className="flex h-6 items-center">
                          <input
                            id="active"
                            type="checkbox"
                            checked={active}
                            onChange={(e) => setActive(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                          />
                        </div>
                        <div className="ml-3 text-sm leading-6">
                          <label
                            htmlFor="active"
                            className="font-medium text-gray-900"
                          >
                            Active
                          </label>
                          <p className="text-gray-500">
                            Uncheck this if the debt has been paid off
                          </p>
                        </div>
                      </div>

                      {error && (
                        <div className="text-red-600 text-sm">{error}</div>
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
                          onClick={onClose}
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
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

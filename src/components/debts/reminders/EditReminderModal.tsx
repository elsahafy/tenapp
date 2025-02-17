import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface Reminder {
  id: string
  debt_id: string
  reminder_type: 'due_date' | 'milestone' | 'custom'
  frequency: 'once' | 'daily' | 'weekly' | 'monthly'
  next_reminder: string
  message?: string
  enabled: boolean
  debt?: {
    name: string
  }
}

interface Debt {
  id: string
  name: string
  due_date: string
}

interface EditReminderModalProps {
  reminder: Reminder
  onClose: () => void
  onSave: () => void
}

export function EditReminderModal({
  reminder,
  onClose,
  onSave,
}: EditReminderModalProps) {
  const [debts, setDebts] = useState<Debt[]>([])
  const [debtId, setDebtId] = useState(reminder.debt_id)
  const [reminderType, setReminderType] = useState(reminder.reminder_type)
  const [frequency, setFrequency] = useState(reminder.frequency)
  const [nextReminder, setNextReminder] = useState(
    format(new Date(reminder.next_reminder), 'yyyy-MM-dd')
  )
  const [message, setMessage] = useState(reminder.message || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDebts()
  }, [])

  async function fetchDebts() {
    try {
      const { data, error } = await supabase
        .from('debts')
        .select('id, name, due_date')
        .eq('active', true)
        .order('name')

      if (error) throw error
      setDebts(data || [])
    } catch (error) {
      console.error('Error fetching debts:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('debt_reminders')
        .update({
          debt_id: debtId,
          reminder_type: reminderType,
          frequency,
          next_reminder: new Date(nextReminder).toISOString(),
          message: message || null,
        })
        .eq('id', reminder.id)

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
                      Edit Payment Reminder
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                      <div>
                        <label
                          htmlFor="debt"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Debt
                        </label>
                        <select
                          id="debt"
                          value={debtId}
                          onChange={(e) => setDebtId(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          required
                        >
                          <option value="">Select a debt</option>
                          {debts.map((debt) => (
                            <option key={debt.id} value={debt.id}>
                              {debt.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="reminderType"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Reminder Type
                        </label>
                        <select
                          id="reminderType"
                          value={reminderType}
                          onChange={(e) =>
                            setReminderType(
                              e.target.value as 'due_date' | 'milestone' | 'custom'
                            )
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="due_date">Due Date</option>
                          <option value="milestone">Milestone</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="frequency"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Frequency
                        </label>
                        <select
                          id="frequency"
                          value={frequency}
                          onChange={(e) =>
                            setFrequency(
                              e.target.value as 'once' | 'daily' | 'weekly' | 'monthly'
                            )
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="once">Once</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="nextReminder"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Next Reminder Date
                        </label>
                        <input
                          type="date"
                          id="nextReminder"
                          value={nextReminder}
                          onChange={(e) => setNextReminder(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="message"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Message (Optional)
                        </label>
                        <textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          placeholder="Add a custom message for this reminder"
                        />
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

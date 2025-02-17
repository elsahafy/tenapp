import { Fragment, useState } from 'react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Goal, GoalType, GoalPriority, ContributionFrequency } from '@/types/goals'
import { createGoal } from '@/lib/services/goalService'
import { useAuth } from '@/lib/auth/AuthProvider'

const goalTypes: { id: GoalType; name: string }[] = [
  { id: 'savings', name: 'Savings' },
  { id: 'debt_payoff', name: 'Debt Payoff' },
  { id: 'investment', name: 'Investment' },
  { id: 'purchase', name: 'Purchase' },
  { id: 'emergency_fund', name: 'Emergency Fund' },
  { id: 'custom', name: 'Custom' },
]

const priorities = [
  { id: 'high', name: 'High' },
  { id: 'medium', name: 'Medium' },
  { id: 'low', name: 'Low' },
]

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  typeIcons: Record<GoalType, React.ElementType>
  typeColors: Record<GoalType, string>
}

export default function AddGoalModal({
  open,
  onClose,
  onSuccess,
  typeIcons,
  typeColors,
}: Props) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState(goalTypes[0])
  const [targetAmount, setTargetAmount] = useState('')
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [targetDate, setTargetDate] = useState('')
  const [priority, setPriority] = useState(priorities[1])
  const [contributionFrequency, setContributionFrequency] = useState<string>('monthly')
  const [contributionAmount, setContributionAmount] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const newGoal: Omit<Goal, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        name,
        description,
        type: type.id,
        target_amount: parseFloat(targetAmount),
        current_amount: 0,
        currency: user.user_metadata?.currency || 'USD',
        start_date: new Date(startDate).toISOString(),
        target_date: new Date(targetDate).toISOString(),
        status: 'not_started',
        priority: priority.id as GoalPriority,
        contribution_frequency: contributionFrequency as ContributionFrequency,
        contribution_amount: contributionAmount ? parseFloat(contributionAmount) : undefined,
        auto_contribution: false,
        notifications_enabled: true,
      }

      await createGoal(newGoal)
      onSuccess()
      handleClose()
    } catch (error) {
      console.error('Error creating goal:', error)
      setError('Failed to create goal')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setType(goalTypes[0])
    setTargetAmount('')
    setStartDate(new Date().toISOString().split('T')[0])
    setTargetDate('')
    setPriority(priorities[1])
    setContributionFrequency('monthly')
    setContributionAmount('')
    setError(null)
    onClose()
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
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
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={handleClose}
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
                      Create New Goal
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Goal Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="description"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Description
                        </label>
                        <textarea
                          name="description"
                          id="description"
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <Listbox value={type} onChange={setType}>
                          {({ open }) => (
                            <>
                              <Listbox.Label className="block text-sm font-medium text-gray-700">
                                Goal Type
                              </Listbox.Label>
                              <div className="relative mt-1">
                                <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm">
                                  <span className="block truncate">
                                    {type.name}
                                  </span>
                                </Listbox.Button>

                                <Transition
                                  show={open}
                                  as={Fragment}
                                  leave="transition ease-in duration-100"
                                  leaveFrom="opacity-100"
                                  leaveTo="opacity-0"
                                >
                                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {goalTypes.map((type) => (
                                      <Listbox.Option
                                        key={type.id}
                                        className={({ active }) =>
                                          `relative cursor-default select-none py-2 pl-3 pr-9 ${
                                            active
                                              ? 'bg-blue-600 text-white'
                                              : 'text-gray-900'
                                          }`
                                        }
                                        value={type}
                                      >
                                        {({ selected, active }) => (
                                          <>
                                            <span
                                              className={`block truncate ${
                                                selected
                                                  ? 'font-semibold'
                                                  : 'font-normal'
                                              }`}
                                            >
                                              {type.name}
                                            </span>

                                            {selected ? (
                                              <span
                                                className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                                  active
                                                    ? 'text-white'
                                                    : 'text-blue-600'
                                                }`}
                                              >
                                                <CheckIcon
                                                  className="h-5 w-5"
                                                  aria-hidden="true"
                                                />
                                              </span>
                                            ) : null}
                                          </>
                                        )}
                                      </Listbox.Option>
                                    ))}
                                  </Listbox.Options>
                                </Transition>
                              </div>
                            </>
                          )}
                        </Listbox>
                      </div>

                      <div>
                        <label
                          htmlFor="target-amount"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Target Amount
                        </label>
                        <div className="relative mt-1 rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            name="target-amount"
                            id="target-amount"
                            required
                            min="0"
                            step="0.01"
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(e.target.value)}
                            className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="start-date"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Start Date
                          </label>
                          <input
                            type="date"
                            name="start-date"
                            id="start-date"
                            required
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="target-date"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Target Date
                          </label>
                          <input
                            type="date"
                            name="target-date"
                            id="target-date"
                            required
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            min={startDate}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <Listbox value={priority} onChange={setPriority}>
                          {({ open }) => (
                            <>
                              <Listbox.Label className="block text-sm font-medium text-gray-700">
                                Priority
                              </Listbox.Label>
                              <div className="relative mt-1">
                                <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm">
                                  <span className="block truncate">
                                    {priority.name}
                                  </span>
                                </Listbox.Button>

                                <Transition
                                  show={open}
                                  as={Fragment}
                                  leave="transition ease-in duration-100"
                                  leaveFrom="opacity-100"
                                  leaveTo="opacity-0"
                                >
                                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {priorities.map((priority) => (
                                      <Listbox.Option
                                        key={priority.id}
                                        className={({ active }) =>
                                          `relative cursor-default select-none py-2 pl-3 pr-9 ${
                                            active
                                              ? 'bg-blue-600 text-white'
                                              : 'text-gray-900'
                                          }`
                                        }
                                        value={priority}
                                      >
                                        {({ selected, active }) => (
                                          <>
                                            <span
                                              className={`block truncate ${
                                                selected
                                                  ? 'font-semibold'
                                                  : 'font-normal'
                                              }`}
                                            >
                                              {priority.name}
                                            </span>

                                            {selected ? (
                                              <span
                                                className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                                  active
                                                    ? 'text-white'
                                                    : 'text-blue-600'
                                                }`}
                                              >
                                                <CheckIcon
                                                  className="h-5 w-5"
                                                  aria-hidden="true"
                                                />
                                              </span>
                                            ) : null}
                                          </>
                                        )}
                                      </Listbox.Option>
                                    ))}
                                  </Listbox.Options>
                                </Transition>
                              </div>
                            </>
                          )}
                        </Listbox>
                      </div>

                      <div>
                        <label
                          htmlFor="contribution-frequency"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Contribution Frequency
                        </label>
                        <select
                          id="contribution-frequency"
                          name="contribution-frequency"
                          value={contributionFrequency}
                          onChange={(e) => setContributionFrequency(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="one_time">One Time</option>
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Bi-weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="annually">Annually</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="contribution-amount"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Contribution Amount
                        </label>
                        <div className="relative mt-1 rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            name="contribution-amount"
                            id="contribution-amount"
                            min="0"
                            step="0.01"
                            value={contributionAmount}
                            onChange={(e) => setContributionAmount(e.target.value)}
                            className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      {error && (
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                      )}

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:ml-3 sm:w-auto disabled:opacity-50"
                        >
                          {loading ? 'Creating...' : 'Create Goal'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={handleClose}
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

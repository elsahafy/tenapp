import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Goal, GoalMilestone } from '@/types/goals'
import { updateMilestone } from '@/lib/services/goalService'

interface Props {
  goal: Goal
  milestone: GoalMilestone
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditMilestoneModal({
  goal,
  milestone,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(milestone.name)
  const [targetAmount, setTargetAmount] = useState(
    milestone.target_amount.toString()
  )
  const [targetDate, setTargetDate] = useState(
    new Date(milestone.target_date).toISOString().split('T')[0]
  )
  const [achieved, setAchieved] = useState(milestone.achieved)

  useEffect(() => {
    if (open) {
      setName(milestone.name)
      setTargetAmount(milestone.target_amount.toString())
      setTargetDate(new Date(milestone.target_date).toISOString().split('T')[0])
      setAchieved(milestone.achieved)
      setError(null)
    }
  }, [open, milestone])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)

      const updatedMilestone: GoalMilestone = {
        ...milestone,
        name,
        target_amount: parseFloat(targetAmount),
        target_date: new Date(targetDate).toISOString(),
        achieved,
        achieved_date: achieved ? new Date().toISOString() : null,
      }

      await updateMilestone(updatedMilestone)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating milestone:', error)
      setError('Failed to update milestone')
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
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
                      Edit Milestone
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Milestone Name
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
                            max={goal.target_amount}
                            step="0.01"
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(e.target.value)}
                            className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
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
                          min={new Date().toISOString().split('T')[0]}
                          max={new Date(goal.target_date)
                            .toISOString()
                            .split('T')[0]}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div className="relative flex items-start">
                        <div className="flex h-6 items-center">
                          <input
                            id="achieved"
                            name="achieved"
                            type="checkbox"
                            checked={achieved}
                            onChange={(e) => setAchieved(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                          />
                        </div>
                        <div className="ml-3 text-sm leading-6">
                          <label
                            htmlFor="achieved"
                            className="font-medium text-gray-900"
                          >
                            Mark as Achieved
                          </label>
                          <p className="text-gray-500">
                            Check this box when you've reached this milestone
                          </p>
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

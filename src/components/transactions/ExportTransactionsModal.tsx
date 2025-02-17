import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useUser } from '@/lib/hooks/useUser'
import {
  ExportOptions,
  exportTransactionsToCSV,
  downloadCSV,
} from '@/lib/services/exportService'

interface Props {
  open: boolean
  onClose: () => void
}

export default function ExportTransactionsModal({ open, onClose }: Props) {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<ExportOptions>({
    startDate: '',
    endDate: '',
    types: ['income', 'expense', 'transfer'],
    includeCategories: true,
    includeAccounts: true,
  })

  const handleExport = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      const csvContent = await exportTransactionsToCSV(user.id, options)
      const filename = `transactions_${new Date()
        .toISOString()
        .split('T')[0]}.csv`
      downloadCSV(csvContent, filename)

      onClose()
    } catch (error) {
      console.error('Error exporting transactions:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
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
                  <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Export Transactions
                    </Dialog.Title>

                    <div className="mt-4 space-y-4">
                      {/* Date Range */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="startDate"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Start Date
                          </label>
                          <input
                            type="date"
                            id="startDate"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={options.startDate}
                            onChange={(e) =>
                              setOptions({
                                ...options,
                                startDate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="endDate"
                            className="block text-sm font-medium text-gray-700"
                          >
                            End Date
                          </label>
                          <input
                            type="date"
                            id="endDate"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            value={options.endDate}
                            onChange={(e) =>
                              setOptions({
                                ...options,
                                endDate: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* Transaction Types */}
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Transaction Types
                        </label>
                        <div className="mt-2 space-y-2">
                          {(['income', 'expense', 'transfer'] as const).map(
                            (type) => (
                              <label
                                key={type}
                                className="inline-flex items-center mr-4"
                              >
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={options.types?.includes(type) ?? false}
                                  onChange={(e) => {
                                    const types = options.types || []
                                    setOptions({
                                      ...options,
                                      types: e.target.checked
                                        ? [...types, type]
                                        : types.filter((t) => t !== type),
                                    })
                                  }}
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </span>
                              </label>
                            )
                          )}
                        </div>
                      </div>

                      {/* Include Options */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Include in Export
                        </label>
                        <div className="space-x-4">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={options.includeCategories}
                              onChange={(e) =>
                                setOptions({
                                  ...options,
                                  includeCategories: e.target.checked,
                                })
                              }
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Categories
                            </span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={options.includeAccounts}
                              onChange={(e) =>
                                setOptions({
                                  ...options,
                                  includeAccounts: e.target.checked,
                                })
                              }
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Accounts
                            </span>
                          </label>
                        </div>
                      </div>

                      {error && (
                        <div className="rounded-md bg-red-50 p-4">
                          <div className="flex">
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">
                                Error
                              </h3>
                              <div className="mt-2 text-sm text-red-700">
                                {error}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:ml-3 sm:w-auto disabled:opacity-50"
                    onClick={handleExport}
                    disabled={loading}
                  >
                    {loading ? 'Exporting...' : 'Export CSV'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

import { useAuth } from '@/lib/auth/AuthProvider'
import { useCurrency } from '@/lib/hooks/useCurrency'
import { getDebtPayoffHistory } from '@/lib/services/debtService'
import { formatCurrency } from '@/lib/utils/formatters'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Fragment, useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

interface Props {
  accountId: string
  open: boolean
  onClose: () => void
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

interface HistoryEntry {
  date: string
  balance: number
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  const { currency } = useCurrency()

  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">{new Date(label || '').toLocaleDateString()}</p>
        <p className="text-sm font-semibold text-indigo-600">
          Balance: {formatCurrency(payload[0].value, currency)}
        </p>
      </div>
    )
  }
  return null
}

export default function DebtPayoffHistory({ accountId, open, onClose }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { currency } = useCurrency()

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        const historyData = await getDebtPayoffHistory(user.id, accountId)
        if (!historyData) {
          throw new Error('Failed to fetch debt history')
        }

        setHistory(historyData)
      } catch (err) {
        console.error('Error fetching debt history:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while fetching debt history')
      } finally {
        setLoading(false)
      }
    }

    if (open && accountId) {
      fetchHistory()
    }
  }, [accountId, open, user])

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={onClose}
      >
        <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
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

          <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
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
            <div className="inline-block w-full max-w-4xl transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:p-6 sm:align-middle">
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
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                    Debt Payoff History
                  </Dialog.Title>

                  <div className="mt-4">
                    {error && (
                      <div
                        className="mb-4 rounded-md bg-red-50 p-4"
                        role="alert"
                        aria-live="polite"
                      >
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}

                    {loading ? (
                      <div
                        className="flex items-center justify-center h-[400px]"
                        role="progressbar"
                        aria-label="Loading debt history data"
                      >
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div
                          className="h-[400px]"
                          role="region"
                          aria-label="Debt balance history chart"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={history}
                              margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                              <XAxis
                                dataKey="date"
                                tickFormatter={(date) => new Date(date).toLocaleDateString()}
                                stroke="#6B7280"
                                aria-label="Date"
                              />
                              <YAxis
                                tickFormatter={(value) => formatCurrency(value, currency)}
                                stroke="#6B7280"
                                aria-label="Balance"
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <defs>
                                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1} />
                                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.01} />
                                </linearGradient>
                              </defs>
                              <Area
                                type="monotone"
                                dataKey="balance"
                                stroke="#6366F1"
                                strokeWidth={2}
                                fill="url(#colorBalance)"
                                animationDuration={1000}
                                role="img"
                                aria-label="Debt balance trend line"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                        {history.length > 0 && (
                          <div
                            className="bg-gray-50 rounded-lg p-4"
                            role="region"
                            aria-label="Debt history summary"
                          >
                            <h4 className="text-sm font-medium text-gray-900 mb-2" id="summary-title">Summary</h4>
                            <dl
                              className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                              aria-labelledby="summary-title"
                            >
                              <div>
                                <dt className="text-sm text-gray-500">Starting Balance</dt>
                                <dd
                                  className="text-lg font-medium text-gray-900"
                                  aria-label={`Starting balance: ${formatCurrency(history[0].balance, currency)}`}
                                >
                                  {formatCurrency(history[0].balance, currency)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-sm text-gray-500">Current Balance</dt>
                                <dd
                                  className="text-lg font-medium text-gray-900"
                                  aria-label={`Current balance: ${formatCurrency(history[history.length - 1].balance, currency)}`}
                                >
                                  {formatCurrency(history[history.length - 1].balance, currency)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-sm text-gray-500">Total Paid</dt>
                                <dd
                                  className="text-lg font-medium text-gray-900"
                                  aria-label={`Total paid: ${formatCurrency(history[0].balance - history[history.length - 1].balance, currency)}`}
                                >
                                  {formatCurrency(history[0].balance - history[history.length - 1].balance, currency)}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  Scale,
  ScaleOptionsByType,
} from 'chart.js'
import { addMonths, format } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface Debt {
  id: string
  name: string
  current_balance: number
  interest_rate: number
  minimum_payment: number
}

interface PayoffStrategy {
  name: string
  method: 'snowball' | 'avalanche' | 'custom'
  totalInterest: number
  payoffDate: Date
  monthlyPayment: number
  timeline: {
    date: Date
    balance: number
  }[]
}

export function PayoffCalculator() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [extraPayment, setExtraPayment] = useState(0)
  const [strategies, setStrategies] = useState<PayoffStrategy[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<string>('snowball')

  useEffect(() => {
    fetchDebts()
  }, [])

  useEffect(() => {
    if (debts.length > 0) {
      calculateStrategies()
    }
  }, [debts, extraPayment])

  async function fetchDebts() {
    try {
      const { data, error } = await supabase
        .from('debts')
        .select('id, name, current_balance, interest_rate, minimum_payment')
        .eq('active', true)
        .order('current_balance', { ascending: true })

      if (error) throw error
      setDebts(data || [])
    } catch (error) {
      console.error('Error fetching debts:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePayoffTimeline = (
    debts: Debt[],
    method: 'snowball' | 'avalanche' | 'custom',
    extraPayment: number
  ): PayoffStrategy => {
    // Sort debts based on strategy
    const sortedDebts = [...debts].sort((a, b) => {
      if (method === 'snowball') {
        return a.current_balance - b.current_balance
      } else if (method === 'avalanche') {
        return b.interest_rate - a.interest_rate
      }
      return 0
    })

    let totalBalance = debts.reduce((sum, debt) => sum + debt.current_balance, 0)
    let totalMinPayment = debts.reduce(
      (sum, debt) => sum + debt.minimum_payment,
      0
    )
    let monthlyPayment = totalMinPayment + extraPayment
    let currentDate = new Date()
    let timeline = [{ date: currentDate, balance: totalBalance }]
    let totalInterest = 0

    // Calculate monthly payments until all debts are paid
    while (totalBalance > 0) {
      let remainingExtra = extraPayment

      // Apply minimum payments and calculate interest
      sortedDebts.forEach((debt) => {
        if (debt.current_balance <= 0) return

        // Calculate interest
        const monthlyInterest =
          (debt.current_balance * (debt.interest_rate / 100)) / 12
        totalInterest += monthlyInterest
        debt.current_balance += monthlyInterest

        // Apply minimum payment
        const payment = Math.min(debt.current_balance, debt.minimum_payment)
        debt.current_balance -= payment

        // Apply extra payment to the target debt
        if (remainingExtra > 0 && debt.current_balance > 0) {
          const extraPaymentAmount = Math.min(
            debt.current_balance,
            remainingExtra
          )
          debt.current_balance -= extraPaymentAmount
          remainingExtra -= extraPaymentAmount
        }
      })

      totalBalance = sortedDebts.reduce(
        (sum, debt) => sum + Math.max(0, debt.current_balance),
        0
      )
      currentDate = addMonths(currentDate, 1)
      timeline.push({ date: currentDate, balance: totalBalance })
    }

    return {
      name: method === 'snowball' ? 'Debt Snowball' : 'Debt Avalanche',
      method,
      totalInterest,
      payoffDate: currentDate,
      monthlyPayment,
      timeline,
    }
  }

  const calculateStrategies = () => {
    const snowball = calculatePayoffTimeline([...debts], 'snowball', extraPayment)
    const avalanche = calculatePayoffTimeline(
      [...debts],
      'avalanche',
      extraPayment
    )
    setStrategies([snowball, avalanche])
  }

  const selectedStrategyData = strategies.find((s) => s.method === selectedStrategy)

  const chartData = {
    labels: selectedStrategyData?.timeline.map((point) =>
      format(point.date, 'MMM yyyy')
    ),
    datasets: [
      {
        label: selectedStrategyData?.name,
        data: selectedStrategyData?.timeline.map((point) => point.balance),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1,
      },
    ],
  }

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Debt Payoff Timeline',
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (typeof value === 'number') {
              return `$${value.toLocaleString()}`
            }
            return value
          }
        },
      },
    },
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-64 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-gray-900">
            Debt Payoff Calculator
          </h2>
        </div>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="extraPayment"
              className="block text-sm font-medium text-gray-700"
            >
              Extra Monthly Payment
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="extraPayment"
                value={extraPayment}
                onChange={(e) => setExtraPayment(Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="0.00"
                min="0"
                step="10"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="strategy"
              className="block text-sm font-medium text-gray-700"
            >
              Payoff Strategy
            </label>
            <select
              id="strategy"
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="snowball">Debt Snowball (Smallest Balance First)</option>
              <option value="avalanche">
                Debt Avalanche (Highest Interest First)
              </option>
            </select>
          </div>

          {selectedStrategyData && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Monthly Payment
                </h3>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  ${selectedStrategyData.monthlyPayment.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Total Interest
                </h3>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  ${selectedStrategyData.totalInterest.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="text-sm font-medium text-gray-500">Payoff Date</h3>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {format(selectedStrategyData.payoffDate, 'MMM yyyy')}
                </p>
              </div>
            </div>
          )}

          <div className="h-96">
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Strategy Comparison
            </h3>
            <div className="space-y-4">
              {strategies.map((strategy) => (
                <div key={strategy.method} className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {strategy.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Payoff by {format(strategy.payoffDate, 'MMM yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${strategy.totalInterest.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">Total Interest</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

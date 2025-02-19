import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Line } from 'react-chartjs-2'
import { Amount } from '@/components/ui/amount'
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
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                currencyDisplay: 'narrowSymbol'
              }).format(value)
            }
            return value
          }
        }
      }
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-primary-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Debt</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            <Amount value={debts.reduce((sum, debt) => sum + debt.current_balance, 0)} currency="USD" />
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">Monthly Payment</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            <Amount value={selectedStrategyData?.monthlyPayment || 0} currency="USD" />
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Interest</h3>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            <Amount value={selectedStrategyData?.totalInterest || 0} currency="USD" />
          </p>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="extraPayment" className="block text-sm font-medium text-gray-700">
          Extra Monthly Payment
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            name="extraPayment"
            id="extraPayment"
            className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
            placeholder="0.00"
            value={extraPayment}
            onChange={(e) => setExtraPayment(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedStrategy('snowball')}
            className={`px-4 py-2 rounded-md ${
              selectedStrategy === 'snowball'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Snowball Method
          </button>
          <button
            onClick={() => setSelectedStrategy('avalanche')}
            className={`px-4 py-2 rounded-md ${
              selectedStrategy === 'avalanche'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Avalanche Method
          </button>
        </div>
      </div>

      <div className="h-96">
        <Line options={chartOptions} data={chartData} />
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Debt Details</h3>
        <div className="space-y-4">
          {debts.map((debt) => (
            <div key={debt.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{debt.name}</h4>
                  <p className="text-sm text-gray-500">
                    {debt.interest_rate}% APR
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    <Amount value={debt.current_balance} currency="USD" />
                  </p>
                  <p className="text-sm text-gray-500">
                    Min Payment: <Amount value={debt.minimum_payment} currency="USD" />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

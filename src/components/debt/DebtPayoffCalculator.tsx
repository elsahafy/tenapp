import { useState } from 'react'
import type { Database } from '@/lib/types/database'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row']

interface DebtPayoffCalculatorProps {
  payoffPlan: {
    totalMonths: number
    monthlyPayment: number
    accountPayoffs: {
      account: Account
      monthsToPayoff: number
      monthlyPayment: number
      totalInterest: number
    }[]
  }
  totalDebt: number
}

export function DebtPayoffCalculator({ payoffPlan, totalDebt }: DebtPayoffCalculatorProps) {
  const [customPayment, setCustomPayment] = useState(payoffPlan.monthlyPayment.toString())

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Debt Payoff Strategy</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Calculate how quickly you can become debt-free
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="monthly-payment" className="block text-sm font-medium text-gray-700">
              Monthly Payment
            </label>
            <div className="mt-2 flex rounded-md shadow-sm">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                $
              </span>
              <input
                type="number"
                name="monthly-payment"
                id="monthly-payment"
                className="block w-full min-w-0 flex-1 rounded-none rounded-r-md border-gray-300 focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                value={customPayment}
                onChange={(e) => setCustomPayment(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md bg-purple-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-purple-800">Payment Strategy</h3>
                <div className="mt-2 text-sm text-purple-700">
                  <p>
                    With a monthly payment of ${Number(customPayment).toLocaleString()}, you can be debt-free in{' '}
                    {Math.ceil(totalDebt / Number(customPayment))} months.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {payoffPlan.accountPayoffs.map((payoff, idx) => (
                <li key={payoff.account.id}>
                  <div className="relative pb-8">
                    {idx < payoffPlan.accountPayoffs.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center ring-8 ring-white">
                          <span className="text-sm text-white font-medium">{idx + 1}</span>
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-900">
                            {payoff.account.name}
                            <span className="ml-2 text-sm text-gray-500">
                              (${payoff.account.current_balance.toLocaleString()})
                            </span>
                          </p>
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                          <p>{payoff.monthsToPayoff} months</p>
                          <p className="text-purple-600">${payoff.monthlyPayment.toLocaleString()}/mo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

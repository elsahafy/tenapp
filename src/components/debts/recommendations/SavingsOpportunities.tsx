import { ArrowTrendingDownIcon } from '@heroicons/react/24/outline'

interface Recommendation {
  id: string
  category: string
  title: string
  potential_savings: number
  implemented: boolean
}

interface SavingsOpportunitiesProps {
  recommendations: Recommendation[]
  totalDebt: number
}

export function SavingsOpportunities({
  recommendations,
  totalDebt,
}: SavingsOpportunitiesProps) {
  const totalPotentialSavings = recommendations
    .filter((rec) => !rec.implemented)
    .reduce((sum, rec) => sum + rec.potential_savings, 0)

  const savingsByCategory = recommendations
    .filter((rec) => !rec.implemented)
    .reduce((acc, rec) => {
      if (!acc[rec.category]) {
        acc[rec.category] = 0
      }
      acc[rec.category] += rec.potential_savings
      return acc
    }, {} as Record<string, number>)

  const categoryLabels: Record<string, string> = {
    high_interest: 'High Interest Reduction',
    spending: 'Spending Optimization',
    balance_transfer: 'Balance Transfer Savings',
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-base font-semibold text-gray-900 flex items-center">
          <ArrowTrendingDownIcon className="h-5 w-5 mr-2 text-primary-600" />
          Savings Opportunities
        </h2>

        <div className="mt-6">
          <div className="rounded-lg bg-primary-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-700">Total Potential Savings</p>
                <p className="mt-1 text-2xl font-semibold text-primary-900">
                  ${totalPotentialSavings.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary-700">
                  Percent of Total Debt
                </p>
                <p className="mt-1 text-2xl font-semibold text-primary-900">
                  {((totalPotentialSavings / totalDebt) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Savings by Category
            </h3>
            <div className="space-y-4">
              {Object.entries(savingsByCategory).map(([category, amount]) => (
                <div key={category} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {categoryLabels[category]}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        ${amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{
                          width: `${(amount / totalPotentialSavings) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-500">
              Implementing these recommendations could help you save money and pay
              off your debt faster. Focus on high-priority items first for maximum
              impact.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

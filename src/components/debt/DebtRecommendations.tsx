import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'

interface DebtRecommendation {
  type: 'minimum_payment' | 'high_interest' | 'balance_transfer' | 'debt_to_income'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  accounts: string[]
  created_at: string
}

interface DebtRecommendationsProps {
  recommendations: DebtRecommendation[]
}

const getRecommendationIcon = (type: DebtRecommendation['type']) => {
  switch (type) {
    case 'high_interest':
      return ExclamationTriangleIcon
    case 'balance_transfer':
      return ArrowTrendingUpIcon
    case 'minimum_payment':
      return LightBulbIcon
    default:
      return InformationCircleIcon
  }
}

const getRecommendationColors = (type: DebtRecommendation['type']) => {
  switch (type) {
    case 'high_interest':
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        icon: 'text-yellow-400',
        description: 'text-yellow-700',
      }
    case 'balance_transfer':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        icon: 'text-purple-400',
        description: 'text-purple-700',
      }
    case 'minimum_payment':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        icon: 'text-blue-400',
        description: 'text-blue-700',
      }
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-800',
        icon: 'text-gray-400',
        description: 'text-gray-700',
      }
  }
}

export function DebtRecommendations({ recommendations }: DebtRecommendationsProps) {
  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Smart Recommendations</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          AI-powered suggestions to optimize your debt management strategy
        </p>
      </div>
      <div className="border-t border-gray-200">
        <div className="divide-y divide-gray-200">
          {recommendations.map((recommendation, index) => {
            const Icon = getRecommendationIcon(recommendation.type)
            const colors = getRecommendationColors(recommendation.type)

            return (
              <div
                key={index}
                className={`p-4 ${colors.bg} transition duration-150 ease-in-out hover:bg-opacity-75`}
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Icon className={`h-5 w-5 ${colors.icon}`} aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h4 className={`text-sm font-medium ${colors.text}`}>
                      {recommendation.title}
                      <span className="ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-white bg-opacity-50">
                        {recommendation.priority}
                      </span>
                    </h4>
                    <div className={`mt-2 text-sm ${colors.description}`}>
                      <p>{recommendation.description}</p>
                      {recommendation.accounts.length > 0 && (
                        <ul className="mt-2 list-disc pl-5 space-y-1">
                          {recommendation.accounts.map((account, idx) => (
                            <li key={idx}>{account}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

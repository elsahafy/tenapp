import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

interface Recommendation {
  id: string
  category: string
  title: string
  description: string
  potential_savings: number
  priority: number
  implemented: boolean
}

interface RecommendationListProps {
  recommendations: Recommendation[]
  onImplemented: (id: string) => void
}

export function RecommendationList({
  recommendations,
  onImplemented,
}: RecommendationListProps) {
  const handleImplemented = async (id: string) => {
    try {
      const { error } = await supabase
        .from('debt_recommendations')
        .update({ implemented: true })
        .eq('id', id)

      if (error) throw error
      onImplemented(id)
    } catch (error) {
      console.error('Error updating recommendation:', error)
    }
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-900">
              No Recommendations
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              You're doing great! We don't have any recommendations at this time.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Personalized Recommendations
        </h2>
        <div className="space-y-4">
          {recommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className={`rounded-lg p-4 ${
                recommendation.implemented
                  ? 'bg-green-50'
                  : recommendation.priority === 1
                  ? 'bg-red-50'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    {recommendation.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {recommendation.description}
                  </p>
                  <div className="mt-2 flex items-center space-x-4">
                    <div>
                      <p className="text-xs text-gray-500">Potential Savings</p>
                      <p className="text-sm font-medium text-gray-900">
                        ${recommendation.potential_savings.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Priority</p>
                      <p
                        className={`text-sm font-medium ${
                          recommendation.priority === 1
                            ? 'text-red-700'
                            : 'text-gray-900'
                        }`}
                      >
                        {recommendation.priority === 1 ? 'High' : 'Medium'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {recommendation.category.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>
                {!recommendation.implemented && (
                  <button
                    onClick={() => handleImplemented(recommendation.id)}
                    className="ml-4 flex-shrink-0 rounded-md bg-white px-3 py-2 text-sm font-medium text-primary-600 shadow-sm ring-1 ring-inset ring-primary-300 hover:bg-primary-50"
                  >
                    Mark Implemented
                  </button>
                )}
                {recommendation.implemented && (
                  <div className="ml-4 flex items-center text-green-700">
                    <CheckCircleIcon className="h-5 w-5 mr-1" />
                    <span className="text-sm">Implemented</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

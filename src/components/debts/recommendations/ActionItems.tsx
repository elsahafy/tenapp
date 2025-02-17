import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

interface Recommendation {
  id: string
  category: string
  title: string
  priority: number
  implemented: boolean
}

interface ActionItemsProps {
  recommendations: Recommendation[]
}

export function ActionItems({ recommendations }: ActionItemsProps) {
  const pendingActions = recommendations.filter((rec) => !rec.implemented)
  const completedActions = recommendations.filter((rec) => rec.implemented)

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-base font-semibold text-gray-900 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2 text-primary-600" />
          Action Items
        </h2>

        <div className="mt-6">
          <div className="space-y-6">
            {/* Pending Actions */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Pending Actions ({pendingActions.length})
              </h3>
              {pendingActions.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No pending actions. Great job!
                </p>
              ) : (
                <ul className="space-y-3">
                  {pendingActions
                    .sort((a, b) => a.priority - b.priority)
                    .map((action) => (
                      <li
                        key={action.id}
                        className="flex items-center space-x-3 text-sm"
                      >
                        <span
                          className={`flex-shrink-0 rounded-full h-2 w-2 ${
                            action.priority === 1
                              ? 'bg-red-500'
                              : 'bg-yellow-500'
                          }`}
                        ></span>
                        <span className="flex-1 text-gray-900">
                          {action.title}
                        </span>
                        <span
                          className={`flex-shrink-0 text-xs font-medium ${
                            action.priority === 1
                              ? 'text-red-700'
                              : 'text-yellow-700'
                          }`}
                        >
                          {action.priority === 1 ? 'High' : 'Medium'}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {/* Completed Actions */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Completed Actions ({completedActions.length})
              </h3>
              {completedActions.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Start implementing recommendations to see your progress here.
                </p>
              ) : (
                <ul className="space-y-3">
                  {completedActions.map((action) => (
                    <li
                      key={action.id}
                      className="flex items-center space-x-3 text-sm"
                    >
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <span className="flex-1 text-gray-500">{action.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Progress Summary */}
            <div className="pt-4 border-t border-gray-200">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    Implementation Progress
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {completedActions.length} of {recommendations.length}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{
                      width: `${
                        (completedActions.length / recommendations.length) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                {pendingActions.length === 0
                  ? 'All recommendations have been implemented. Great work!'
                  : `You have ${pendingActions.length} pending action${
                      pendingActions.length === 1 ? '' : 's'
                    }. Focus on high-priority items first.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

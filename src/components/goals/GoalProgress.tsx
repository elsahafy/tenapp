import { useState, useEffect } from 'react'
import { Goal, GoalType, GoalAnalytics, GoalMilestone } from '@/types/goals'
import { formatCurrency } from '@/lib/currency/currencies'
import { getGoalAnalytics, getGoalMilestones } from '@/lib/services/goalService'
import AddMilestoneModal from './AddMilestoneModal'
import EditMilestoneModal from './EditMilestoneModal'
import DeleteMilestoneModal from './DeleteMilestoneModal'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
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
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface Props {
  goal: Goal
  onGoalUpdate: () => void
  typeIcons: Record<GoalType, React.ElementType>
  typeColors: Record<GoalType, string>
}

export default function GoalProgress({
  goal,
  onGoalUpdate,
  typeIcons,
  typeColors,
}: Props) {
  const [analytics, setAnalytics] = useState<GoalAnalytics | null>(null)
  const [milestones, setMilestones] = useState<GoalMilestone[]>([])
  const [showAddMilestone, setShowAddMilestone] = useState(false)
  const [editMilestone, setEditMilestone] = useState<GoalMilestone | null>(null)
  const [deleteMilestone, setDeleteMilestone] = useState<GoalMilestone | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadGoalData()
  }, [goal.id])

  const loadGoalData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [goalAnalytics, goalMilestones] = await Promise.all([
        getGoalAnalytics(goal.id),
        getGoalMilestones(goal.id),
      ])
      setAnalytics(goalAnalytics)
      setMilestones(goalMilestones)
    } catch (error) {
      console.error('Error loading goal data:', error)
      setError('Failed to load goal details')
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return (
          <ArrowTrendingUpIcon
            className="h-5 w-5 text-green-500"
            aria-hidden="true"
          />
        )
      case 'declining':
        return (
          <ArrowTrendingDownIcon
            className="h-5 w-5 text-red-500"
            aria-hidden="true"
          />
        )
      default:
        return <MinusIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadGoalData}
          className="mt-2 text-sm text-red-600 hover:text-red-500"
        >
          Try again
        </button>
      </div>
    )
  }

  const Icon = typeIcons[goal.type]
  const colorClass = typeColors[goal.type]
  const progress = (goal.current_amount / goal.target_amount) * 100

  return (
    <div className="space-y-6">
      {/* Goal Header */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:flex sm:items-center">
              <div
                className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${
                  goal.color || 'bg-gray-100'
                }`}
              >
                <Icon className={`h-8 w-8 ${colorClass}`} aria-hidden="true" />
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {goal.name}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {goal.description}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                <div
                  style={{ width: `${progress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
                />
              </div>
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-900">
              <div>
                {formatCurrency(goal.current_amount, goal.currency)}{' '}
                <span className="text-gray-500">of</span>{' '}
                {formatCurrency(goal.target_amount, goal.currency)}
              </div>
              <div>{progress.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getTrendIcon(analytics.trend)}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Monthly Contribution
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(
                        analytics.monthly_contribution_average,
                        goal.currency
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span
                    className={`inline-flex items-center justify-center h-10 w-10 rounded-full ${
                      analytics.is_on_track
                        ? 'bg-green-100'
                        : 'bg-yellow-100'
                    }`}
                  >
                    {analytics.is_on_track ? (
                      <ArrowTrendingUpIcon
                        className="h-6 w-6 text-green-600"
                        aria-hidden="true"
                      />
                    ) : (
                      <ArrowTrendingDownIcon
                        className="h-6 w-6 text-yellow-600"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Time Remaining
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {Math.ceil(analytics.time_remaining_days / 30)} months
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Required Monthly
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(
                        analytics.required_monthly_contribution,
                        goal.currency
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Milestones
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Track your progress with specific milestones
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                type="button"
                onClick={() => setShowAddMilestone(true)}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Add Milestone
              </button>
            </div>
          </div>

          <div className="mt-6 flow-root">
            <ul role="list" className="-my-5 divide-y divide-gray-200">
              {milestones.map((milestone) => (
                <li key={milestone.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {milestone.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(milestone.target_amount, goal.currency)} by{' '}
                        {new Date(milestone.target_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditMilestone(milestone)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <PencilIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setDeleteMilestone(milestone)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <TrashIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddMilestoneModal
        goal={goal}
        open={showAddMilestone}
        onClose={() => setShowAddMilestone(false)}
        onSuccess={loadGoalData}
      />

      {editMilestone && (
        <EditMilestoneModal
          goal={goal}
          milestone={editMilestone}
          open={!!editMilestone}
          onClose={() => setEditMilestone(null)}
          onSuccess={loadGoalData}
        />
      )}

      {deleteMilestone && (
        <DeleteMilestoneModal
          milestone={deleteMilestone}
          open={!!deleteMilestone}
          onClose={() => setDeleteMilestone(null)}
          onSuccess={loadGoalData}
        />
      )}
    </div>
  )
}

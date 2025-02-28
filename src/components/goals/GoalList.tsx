import { Goal, GoalType } from '@/types/goals'
import { formatCurrency } from '@/lib/currency/currencies'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import EditGoalModal from './EditGoalModal'
import DeleteGoalModal from './DeleteGoalModal'
import { getGoals } from '@/lib/services/goalService'

interface Props {
  selectedGoal: Goal | null
  onGoalSelect: (goal: Goal) => void
  onGoalsChange: () => void
  typeIcons: Record<GoalType, React.ElementType>
  typeColors: Record<GoalType, string>
}

export default function GoalList({
  selectedGoal,
  onGoalSelect,
  onGoalsChange,
  typeIcons,
  typeColors,
}: Props) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved':
        return 'bg-green-100 text-green-800'
      case 'on_track':
        return 'bg-blue-100 text-blue-800'
      case 'behind':
        return 'bg-red-100 text-red-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const userId = 'current-user-id'; // Replace with actual user ID
        const fetchedGoals = await getGoals(userId);
        setGoals(fetchedGoals);
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  return (
    <div className="goal-list-container">
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <svg 
            className="animate-spin h-5 w-5 text-blue-600" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
            role="status"
            aria-label="Loading goals"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      ) : goals.length === 0 ? (
        <p className="text-center text-gray-500">No goals found. Start by adding a new goal!</p>
      ) : (
        <div>
          <h3 className="text-lg font-medium text-gray-900">Your Goals</h3>
          <ul role="list" className="mt-4 divide-y divide-gray-200">
            {goals.map((goal) => {
              const Icon = typeIcons[goal.type]
              const colorClass = typeColors[goal.type]
              const progress = (goal.current_amount / goal.target_amount) * 100

              return (
                <li
                  key={goal.id}
                  className={`py-4 cursor-pointer hover:bg-gray-50 ${
                    selectedGoal?.id === goal.id ? 'bg-gray-50' : ''
                  }`}
                  onClick={() => onGoalSelect(goal)}
                >
                  <div className="flex items-center space-x-4 px-4">
                    <div
                      className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                        goal.color || 'bg-gray-100'
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${colorClass}`} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {goal.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-500 truncate">
                          {formatCurrency(goal.current_amount, goal.currency)} of{' '}
                          {formatCurrency(goal.target_amount, goal.currency)}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                            goal.status
                          )}`}
                        >
                          {formatStatus(goal.status)}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="relative w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="absolute left-0 top-0 h-2 rounded-full bg-blue-600"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditGoal(goal)
                        }}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <PencilIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteGoal(goal)
                        }}
                        className="text-red-400 hover:text-red-500"
                      >
                        <TrashIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          {editGoal && (
            <EditGoalModal
              goal={editGoal}
              open={!!editGoal}
              onClose={() => setEditGoal(null)}
              onSuccess={onGoalsChange}
              typeIcons={typeIcons}
              typeColors={typeColors}
            />
          )}

          {deleteGoal && (
            <DeleteGoalModal
              goal={deleteGoal}
              open={!!deleteGoal}
              onClose={() => setDeleteGoal(null)}
              onSuccess={onGoalsChange}
            />
          )}
        </div>
      )}
    </div>
  )
}

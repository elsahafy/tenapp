import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Goal, GoalType } from '@/types/goals'
import { getGoals } from '@/lib/services/goalService'
import GoalList from './GoalList'
import GoalProgress from './GoalProgress'
import AddGoalModal from './AddGoalModal'
import {
  BanknotesIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  ShoppingBagIcon,
  ShieldCheckIcon,
  StarIcon,
} from '@heroicons/react/24/outline'

const goalTypeIcons: Record<GoalType, React.ElementType> = {
  savings: BanknotesIcon,
  debt_payoff: CreditCardIcon,
  investment: BuildingLibraryIcon,
  purchase: ShoppingBagIcon,
  emergency_fund: ShieldCheckIcon,
  custom: StarIcon,
}

const goalTypeColors: Record<GoalType, string> = {
  savings: 'text-blue-600',
  debt_payoff: 'text-red-600',
  investment: 'text-green-600',
  purchase: 'text-purple-600',
  emergency_fund: 'text-yellow-600',
  custom: 'text-gray-600',
}

export default function GoalsDashboard() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadGoals()
    }
  }, [user])

  const loadGoals = async () => {
    try {
      setLoading(true)
      setError(null)
      const userGoals = await getGoals(user!.id)
      setGoals(userGoals)
      if (userGoals.length > 0 && !selectedGoal) {
        setSelectedGoal(userGoals[0])
      }
    } catch (error) {
      console.error('Error loading goals:', error)
      setError('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  const handleGoalCreated = () => {
    loadGoals()
    setShowAddGoal(false)
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
          onClick={loadGoals}
          className="mt-2 text-sm text-red-600 hover:text-red-500"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Financial Goals
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage your financial goals
          </p>
        </div>
        <div className="mt-4 sm:ml-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setShowAddGoal(true)}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Add Goal
          </button>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <StarIcon className="h-12 w-12" aria-hidden="true" />
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No goals</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new financial goal.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowAddGoal(true)}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Create Goal
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Goal List */}
          <div className="lg:col-span-1">
            <GoalList
              goals={goals}
              selectedGoal={selectedGoal}
              onGoalSelect={setSelectedGoal}
              onGoalsChange={loadGoals}
              typeIcons={goalTypeIcons}
              typeColors={goalTypeColors}
            />
          </div>

          {/* Goal Progress */}
          {selectedGoal && (
            <div className="lg:col-span-2">
              <GoalProgress
                goal={selectedGoal}
                onGoalUpdate={loadGoals}
                typeIcons={goalTypeIcons}
                typeColors={goalTypeColors}
              />
            </div>
          )}
        </div>
      )}

      {/* Add Goal Modal */}
      <AddGoalModal
        open={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        onSuccess={handleGoalCreated}
        typeIcons={goalTypeIcons}
        typeColors={goalTypeColors}
      />
    </div>
  )
}

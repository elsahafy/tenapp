'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useState } from 'react'
import AddGoalModal from './AddGoalModal'
import { PlusIcon } from '@heroicons/react/24/outline'
import { GoalType } from '@/types/goals'

const typeIcons = {
  savings: PlusIcon,
  debt_payoff: PlusIcon,
  investment: PlusIcon,
  purchase: PlusIcon,
  emergency_fund: PlusIcon,
  custom: PlusIcon,
}

const typeColors = {
  savings: 'text-blue-600',
  debt_payoff: 'text-red-600',
  investment: 'text-green-600',
  purchase: 'text-purple-600',
  emergency_fund: 'text-yellow-600',
  custom: 'text-gray-600',
}

export default function GoalsDashboard() {
  const [goals, setGoals] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)

  const handleAddGoal = () => {
    setShowAddModal(true)
  }

  const handleModalClose = () => {
    setShowAddModal(false)
  }

  const handleSuccess = () => {
    // Refresh goals list
    setShowAddModal(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your Goals</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Set and track your financial goals
              </p>
            </div>
            <Button onClick={handleAddGoal}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Goal
            </Button>
          </div>
          {goals.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-primary)] p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-50)]">
                <svg
                  className="h-6 w-6 text-[var(--primary-600)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-[var(--text-primary)]">No goals</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Get started by creating a new goal
              </p>
              <div className="mt-6">
                <Button onClick={handleAddGoal}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Goal
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              {/* Goals list will go here */}
            </div>
          )}
        </div>
      </Card>

      <AddGoalModal
        open={showAddModal}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        typeIcons={typeIcons}
        typeColors={typeColors}
      />
    </div>
  )
}

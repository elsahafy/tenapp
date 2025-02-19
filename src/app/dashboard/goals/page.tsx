'use client'

import GoalsDashboard from '@/components/goals/GoalsDashboard'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function GoalsPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Financial Goals</h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Track and manage your financial goals
              </p>
            </div>
          </div>
          <GoalsDashboard />
        </div>
      </div>
    </DashboardLayout>
  )
}

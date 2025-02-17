'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { DebtDashboard } from '@/components/debt/DebtDashboard'

export default function DebtsPage() {
  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Debt Management</h1>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <DebtDashboard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

import DashboardLayout from '@/components/layout/DashboardLayout'
import { AccountSummary } from '@/components/dashboard/AccountSummary'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { SpendingOverview } from '@/components/dashboard/SpendingOverview'
import { AIInsights } from '@/components/dashboard/AIInsights'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between animate-in slide-in-from-bottom duration-500">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Welcome Back</h1>
            <p className="mt-2 text-sm text-gray-500">Here's your financial overview</p>
          </div>
          <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="col-span-1 lg:col-span-2 animate-in slide-in-from-bottom duration-500 delay-100">
            <AccountSummary />
          </div>
          <div className="space-y-8 animate-in slide-in-from-bottom duration-500 delay-200">
            <SpendingOverview />
            <AIInsights />
          </div>
          <div className="animate-in slide-in-from-bottom duration-500 delay-300">
            <RecentTransactions />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

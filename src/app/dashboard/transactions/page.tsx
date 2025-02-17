import DashboardLayout from '@/components/layout/DashboardLayout'
import TransactionList from '@/components/transactions/TransactionList'
import { AddTransactionButton } from '@/components/transactions/AddTransactionButton'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'

export default function TransactionsPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Transactions</h1>
          <AddTransactionButton />
        </div>
        <TransactionFilters />
        <TransactionList />
      </div>
    </DashboardLayout>
  )
}

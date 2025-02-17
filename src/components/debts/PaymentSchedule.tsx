'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, addMonths, startOfMonth } from 'date-fns'

interface ScheduledPayment {
  id: string
  date: string
  amount: number
  debtName: string
}

export function PaymentSchedule() {
  const [payments, setPayments] = useState<ScheduledPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPaymentSchedule()
  }, [])

  async function fetchPaymentSchedule() {
    try {
      const startDate = startOfMonth(new Date())
      const endDate = addMonths(startDate, 3)

      const { data: debts, error } = await supabase
        .from('debts')
        .select('id, name, minimum_payment, due_date')
        .eq('active', true)

      if (error) throw error

      // Generate next 3 months of payments
      const scheduledPayments = debts.flatMap((debt) => {
        const payments = []
        let currentDate = new Date(debt.due_date)

        while (currentDate <= endDate) {
          payments.push({
            id: `${debt.id}-${format(currentDate, 'yyyy-MM')}`,
            date: format(currentDate, 'yyyy-MM-dd'),
            amount: debt.minimum_payment,
            debtName: debt.name,
          })
          currentDate = addMonths(currentDate, 1)
        }

        return payments
      })

      // Sort by date
      scheduledPayments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setPayments(scheduledPayments)
    } catch (error) {
      console.error('Error fetching payment schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Upcoming Payments
        </h2>
        <div className="space-y-4">
          {payments.length > 0 ? (
            payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {payment.debtName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Due: {format(new Date(payment.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ${payment.amount.toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No upcoming payments.</p>
              <p className="text-sm text-gray-400 mt-1">
                Add a debt to see your payment schedule.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

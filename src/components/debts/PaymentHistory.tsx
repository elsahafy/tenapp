import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { EditPaymentModal } from './EditPaymentModal'
import { DeletePaymentModal } from './DeletePaymentModal'
import { Payment, PaymentType } from '@/types'

export function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const [deletePayment, setDeletePayment] = useState<Payment | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [])

  async function fetchPayments() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('debt_payments')
        .select('*, debt:debts(name)')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false })
        .limit(50)

      if (error) throw error
      if (data) {
        const typedPayments: Payment[] = data.map(payment => ({
          ...payment,
          payment_type: payment.payment_type as PaymentType,
          notes: payment.notes || null
        }))
        setPayments(typedPayments)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditPayment = (payment: Payment) => {
    setEditPayment(payment)
  }

  const handleDeletePayment = (payment: Payment) => {
    setDeletePayment(payment)
  }

  const handlePaymentUpdated = () => {
    setEditPayment(null)
    fetchPayments()
  }

  const handlePaymentDeleted = () => {
    setDeletePayment(null)
    fetchPayments()
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Type
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Notes
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                      {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {payment.payment_type}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {payment.notes || '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <button
                        onClick={() => handleEditPayment(payment)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <PencilIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(payment)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editPayment && (
        <EditPaymentModal
          payment={editPayment}
          onSave={handlePaymentUpdated}
          onClose={() => setEditPayment(null)}
        />
      )}

      {deletePayment && (
        <DeletePaymentModal
          payment={deletePayment}
          onDelete={handlePaymentDeleted}
          onClose={() => setDeletePayment(null)}
        />
      )}
    </div>
  )
}

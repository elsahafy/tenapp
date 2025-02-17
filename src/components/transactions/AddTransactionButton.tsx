'use client'

import { useState, useEffect } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { AddTransactionModal } from './AddTransactionModal'
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabase'
import type { Account } from '@/types'

export function AddTransactionButton() {
  const [showModal, setShowModal] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const { user } = useUser()

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('name')

        if (error) throw error
        setAccounts(data as Account[] || [])
      } catch (error) {
        console.error('Error fetching accounts:', error)
      }
    }

    fetchAccounts()
  }, [user])

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-x-1.5 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
        Add Transaction
      </button>

      {showModal && (
        <AddTransactionModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
          accounts={accounts}
        />
      )}
    </>
  )
}

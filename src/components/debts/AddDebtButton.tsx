'use client'

import { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { AddDebtModal } from './AddDebtModal'

export function AddDebtButton() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Add Debt
      </button>

      {showModal && (
        <AddDebtModal
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false)
            // Refresh debt list will be handled by parent component
          }}
        />
      )}
    </>
  )
}

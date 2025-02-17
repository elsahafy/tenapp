'use client'

import { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { AddAccountModal } from './AddAccountModal'

export function AddAccountButton() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Add Account
      </button>

      {showModal && (
        <AddAccountModal
          onClose={() => setShowModal(false)}
          onAdd={() => {
            setShowModal(false)
            window.location.reload()
          }}
        />
      )}
    </>
  )
}

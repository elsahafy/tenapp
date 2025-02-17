import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PlusIcon } from '@heroicons/react/24/outline'
import { ReminderList } from './ReminderList'
import { AddReminderModal } from './AddReminderModal'

interface Reminder {
  id: string
  debt_id: string
  reminder_type: 'due_date' | 'milestone' | 'custom'
  frequency: 'once' | 'daily' | 'weekly' | 'monthly'
  next_reminder: string
  message?: string
  enabled: boolean
  debt?: {
    name: string
  }
}

export function ReminderSettings() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchReminders()
  }, [])

  async function fetchReminders() {
    try {
      const { data, error } = await supabase
        .from('debt_reminders')
        .select('*, debt:debts(name)')
        .order('next_reminder', { ascending: true })

      if (error) throw error
      setReminders(data || [])
    } catch (error) {
      console.error('Error fetching reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReminderAdded = () => {
    setShowAddModal(false)
    fetchReminders()
  }

  const handleReminderUpdated = () => {
    fetchReminders()
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-gray-900">
            Payment Reminders
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Reminder
          </button>
        </div>

        <ReminderList
          reminders={reminders}
          loading={loading}
          onReminderUpdated={handleReminderUpdated}
        />
      </div>

      {showAddModal && (
        <AddReminderModal
          onClose={() => setShowAddModal(false)}
          onSave={handleReminderAdded}
        />
      )}
    </div>
  )
}

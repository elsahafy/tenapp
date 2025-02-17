import { Switch } from '@headlessui/react'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { EditReminderModal } from './EditReminderModal'
import { DeleteReminderModal } from './DeleteReminderModal'

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

interface ReminderListProps {
  reminders: Reminder[]
  loading: boolean
  onReminderUpdated: () => void
}

export function ReminderList({
  reminders,
  loading,
  onReminderUpdated,
}: ReminderListProps) {
  const [editReminder, setEditReminder] = useState<Reminder | null>(null)
  const [deleteReminder, setDeleteReminder] = useState<Reminder | null>(null)

  const handleToggleEnabled = async (reminder: Reminder) => {
    try {
      const { error } = await supabase
        .from('debt_reminders')
        .update({ enabled: !reminder.enabled })
        .eq('id', reminder.id)

      if (error) throw error
      onReminderUpdated()
    } catch (error) {
      console.error('Error updating reminder:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-50 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="space-y-3 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="h-6 w-24 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (reminders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No reminders set up yet.</p>
        <p className="text-sm text-gray-400 mt-1">
          Add a reminder to stay on top of your payments.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reminders.map((reminder) => (
        <div
          key={reminder.id}
          className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="space-y-1 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900">
                {reminder.debt?.name}
              </h3>
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${
                  reminder.reminder_type === 'due_date'
                    ? 'bg-blue-100 text-blue-700'
                    : reminder.reminder_type === 'milestone'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-purple-100 text-purple-700'
                }`}
              >
                {reminder.reminder_type.replace('_', ' ')}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize ${
                  reminder.enabled
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {reminder.frequency}
              </span>
            </div>
            <div className="text-sm text-gray-500 space-x-2">
              <span>
                Next: {format(new Date(reminder.next_reminder), 'MMM d, yyyy')}
              </span>
              {reminder.message && (
                <>
                  <span>•</span>
                  <span>{reminder.message}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Switch
              checked={reminder.enabled}
              onChange={() => handleToggleEnabled(reminder)}
              className={`${
                reminder.enabled ? 'bg-primary-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
            >
              <span
                aria-hidden="true"
                className={`${
                  reminder.enabled ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </Switch>
            <button
              onClick={() => setEditReminder(reminder)}
              className="text-gray-400 hover:text-gray-500"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setDeleteReminder(reminder)}
              className="text-gray-400 hover:text-red-500"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}

      {editReminder && (
        <EditReminderModal
          reminder={editReminder}
          onClose={() => setEditReminder(null)}
          onSave={() => {
            setEditReminder(null)
            onReminderUpdated()
          }}
        />
      )}

      {deleteReminder && (
        <DeleteReminderModal
          reminder={deleteReminder}
          onClose={() => setDeleteReminder(null)}
          onDelete={() => {
            setDeleteReminder(null)
            onReminderUpdated()
          }}
        />
      )}
    </div>
  )
}

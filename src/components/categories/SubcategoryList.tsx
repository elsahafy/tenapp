import { useState, useEffect } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabaseClient'
import { Category, Subcategory } from '@/types/accounts'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import AddSubcategoryModal from './AddSubcategoryModal'
import EditSubcategoryModal from './EditSubcategoryModal'
import DeleteSubcategoryModal from './DeleteSubcategoryModal'

interface Props {
  category: Category
  onUpdate: () => void
}

export default function SubcategoryList({ category, onUpdate }: Props) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editSubcategory, setEditSubcategory] = useState<Subcategory | null>(null)
  const [deleteSubcategory, setDeleteSubcategory] = useState<Subcategory | null>(
    null
  )

  useEffect(() => {
    if (category) {
      loadSubcategories()
    }
  }, [category])

  const loadSubcategories = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', category.id)
        .order('name')

      if (error) throw error
      setSubcategories(data || [])
    } catch (error) {
      console.error('Error loading subcategories:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-24">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Subcategories</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add
        </button>
      </div>

      <div className="bg-gray-50 rounded-md">
        <ul className="divide-y divide-gray-200">
          {subcategories.map((subcategory) => (
            <li
              key={subcategory.id}
              className="px-4 py-3 flex items-center justify-between text-sm"
            >
              <span className="text-gray-700">{subcategory.name}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditSubcategory(subcategory)}
                  className="p-1 rounded-full hover:bg-gray-200"
                >
                  <PencilIcon className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setDeleteSubcategory(subcategory)}
                  className="p-1 rounded-full hover:bg-gray-200"
                >
                  <TrashIcon className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </li>
          ))}
          {subcategories.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-500 italic">
              No subcategories yet
            </li>
          )}
        </ul>
      </div>

      <AddSubcategoryModal
        category={category}
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          loadSubcategories()
          onUpdate()
        }}
      />

      {editSubcategory && (
        <EditSubcategoryModal
          subcategory={editSubcategory}
          open={!!editSubcategory}
          onClose={() => setEditSubcategory(null)}
          onSuccess={() => {
            loadSubcategories()
            onUpdate()
          }}
        />
      )}

      {deleteSubcategory && (
        <DeleteSubcategoryModal
          subcategory={deleteSubcategory}
          open={!!deleteSubcategory}
          onClose={() => setDeleteSubcategory(null)}
          onSuccess={() => {
            loadSubcategories()
            onUpdate()
          }}
        />
      )}
    </div>
  )
}

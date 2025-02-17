import { useState, useEffect } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabaseClient'
import { Category } from '@/types/accounts'
import { useAuth } from '@/lib/auth/AuthProvider'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import AddCategoryModal from './AddCategoryModal'
import EditCategoryModal from './EditCategoryModal'
import DeleteCategoryModal from './DeleteCategoryModal'

export default function CategoryList() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null)

  useEffect(() => {
    if (user) {
      loadCategories()
    }
  }, [user])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*, subcategories(*)')
        .eq('user_id', user?.id)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Categories</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Category
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {categories.map((category) => (
            <li key={category.id}>
              <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                <div className="flex items-center">
                  {category.icon && (
                    <span
                      className="w-8 h-8 flex items-center justify-center rounded-full mr-3"
                      style={{ backgroundColor: category.color || '#E5E7EB' }}
                    >
                      <i className={`fas ${category.icon} text-white`}></i>
                    </span>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {category.subcategories?.length || 0} subcategories
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditCategory(category)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <PencilIcon className="h-4 w-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => setDeleteCategory(category)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <TrashIcon className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <AddCategoryModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadCategories}
      />

      {editCategory && (
        <EditCategoryModal
          category={editCategory}
          open={!!editCategory}
          onClose={() => setEditCategory(null)}
          onSuccess={loadCategories}
        />
      )}

      {deleteCategory && (
        <DeleteCategoryModal
          category={deleteCategory}
          open={!!deleteCategory}
          onClose={() => setDeleteCategory(null)}
          onSuccess={loadCategories}
        />
      )}
    </div>
  )
}

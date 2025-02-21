import { useEffect, useState } from 'react'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { Database } from '@/types/database.types'

type Category = Database['public']['Tables']['categories']['Row']

export function useCategories() {
  const supabase = useSupabaseClient<Database>()
  const user = useUser()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCategories = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) throw error

      setCategories(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch categories'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchCategories()
    }
  }, [user])

  return { categories, isLoading, error }
}

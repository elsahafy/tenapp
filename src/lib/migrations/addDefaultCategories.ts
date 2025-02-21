import { supabase } from '@/lib/supabase'

export async function addDefaultCategories() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('No authenticated user found')
    return
  }

  // First check if categories already exist for this user
  const { data: existingCategories } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)

  if (existingCategories && existingCategories.length > 0) {
    console.log('Categories already exist for this user')
    return
  }

  const incomeCategories = [
    { name: 'Salary', color: '#34D399', icon: 'briefcase' },
    { name: 'Freelance', color: '#60A5FA', icon: 'code' },
    { name: 'Investments', color: '#F59E0B', icon: 'chart-bar' },
    { name: 'Rental Income', color: '#8B5CF6', icon: 'home' },
    { name: 'Business', color: '#EC4899', icon: 'office-building' },
    { name: 'Gifts', color: '#F472B6', icon: 'gift' },
    { name: 'Other Income', color: '#6B7280', icon: 'plus-circle' }
  ]

  const expenseCategories = [
    // Housing & Utilities
    { name: 'Rent/Mortgage', color: '#EF4444', icon: 'home' },
    { name: 'Utilities', color: '#F59E0B', icon: 'light-bulb' },
    { name: 'Internet & Phone', color: '#3B82F6', icon: 'wifi' },
    { name: 'Home Maintenance', color: '#6B7280', icon: 'wrench' },

    // Transportation
    { name: 'Fuel', color: '#DC2626', icon: 'truck' },
    { name: 'Public Transport', color: '#2563EB', icon: 'ticket' },
    { name: 'Car Maintenance', color: '#4B5563', icon: 'cog' },
    { name: 'Parking', color: '#6B7280', icon: 'parking' },

    // Food & Dining
    { name: 'Groceries', color: '#10B981', icon: 'shopping-cart' },
    { name: 'Restaurants', color: '#F59E0B', icon: 'cake' },
    { name: 'Coffee Shops', color: '#92400E', icon: 'coffee' },

    // Shopping
    { name: 'Clothing', color: '#8B5CF6', icon: 'shopping-bag' },
    { name: 'Electronics', color: '#3B82F6', icon: 'device-mobile' },
    { name: 'Home Goods', color: '#6B7280', icon: 'home' },

    // Health & Wellness
    { name: 'Healthcare', color: '#EF4444', icon: 'heart' },
    { name: 'Pharmacy', color: '#DC2626', icon: 'first-aid' },
    { name: 'Fitness', color: '#10B981', icon: 'fire' },

    // Entertainment
    { name: 'Movies & Shows', color: '#8B5CF6', icon: 'film' },
    { name: 'Games', color: '#6366F1', icon: 'puzzle-piece' },
    { name: 'Hobbies', color: '#EC4899', icon: 'music-note' },

    // Education
    { name: 'Books', color: '#8B5CF6', icon: 'book-open' },
    { name: 'Courses', color: '#3B82F6', icon: 'academic-cap' },
    { name: 'Software', color: '#6366F1', icon: 'code' },

    // Financial
    { name: 'Insurance', color: '#1F2937', icon: 'shield-check' },
    { name: 'Taxes', color: '#DC2626', icon: 'document-text' },
    { name: 'Bank Fees', color: '#4B5563', icon: 'credit-card' },
    { name: 'Investments', color: '#F59E0B', icon: 'trending-up' },

    // Personal Care
    { name: 'Hair & Beauty', color: '#EC4899', icon: 'sparkles' },
    { name: 'Spa & Massage', color: '#F472B6', icon: 'sun' },
    { name: 'Personal Care', color: '#6B7280', icon: 'user' },

    // Miscellaneous
    { name: 'Gifts', color: '#F472B6', icon: 'gift' },
    { name: 'Charity', color: '#10B981', icon: 'heart' },
    { name: 'Other Expenses', color: '#6B7280', icon: 'dots-horizontal' }
  ]

  try {
    // Insert income categories
    const { error: incomeError } = await supabase
      .from('categories')
      .insert(incomeCategories.map(category => ({
        ...category,
        type: 'income',
        is_active: true,
        user_id: user.id
      })))

    if (incomeError) throw incomeError

    // Insert expense categories
    const { error: expenseError } = await supabase
      .from('categories')
      .insert(expenseCategories.map(category => ({
        ...category,
        type: 'expense',
        is_active: true,
        user_id: user.id
      })))

    if (expenseError) throw expenseError

    console.log('Successfully added categories for user:', user.id)
  } catch (error) {
    console.error('Error inserting categories:', error)
    throw error
  }
}

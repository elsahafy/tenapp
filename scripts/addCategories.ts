import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local file
config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  try {
    // Test connection
    console.log('Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('categories')
      .select('count')
      .limit(1)
    
    if (testError) {
      throw new Error(`Failed to connect to database: ${testError.message}`)
    }
    console.log('Successfully connected to database')

    // Check if we already have categories
    console.log('Checking for existing categories...')
    const { data: existingCategories, error: checkError } = await supabase
      .from('categories')
      .select('count')
    
    if (checkError) {
      throw new Error(`Failed to check existing categories: ${checkError.message}`)
    }

    console.log('Found', existingCategories?.length || 0, 'existing categories')

    const incomeCategories = [
      { name: 'Salary', color: '#34D399', icon: 'briefcase' },
      { name: 'Investments', color: '#F59E0B', icon: 'trending-up' },
      { name: 'Freelance', color: '#60A5FA', icon: 'code' },
      { name: 'Gifts', color: '#F472B6', icon: 'gift' },
      { name: 'Rental Income', color: '#A78BFA', icon: 'home' },
      { name: 'Other Income', color: '#6B7280', icon: 'dots-horizontal' }
    ]

    const expenseCategories = [
      // Housing & Utilities
      { name: 'Rent/Mortgage', color: '#EF4444', icon: 'home' },
      { name: 'Utilities', color: '#F59E0B', icon: 'light-bulb' },
      { name: 'Internet', color: '#3B82F6', icon: 'wifi' },
      { name: 'Home Maintenance', color: '#6B7280', icon: 'wrench' },

      // Transportation
      { name: 'Fuel', color: '#DC2626', icon: 'truck' },
      { name: 'Public Transport', color: '#F59E0B', icon: 'ticket' },
      { name: 'Car Maintenance', color: '#6B7280', icon: 'wrench' },

      // Food & Dining
      { name: 'Groceries', color: '#10B981', icon: 'shopping-cart' },
      { name: 'Restaurants', color: '#F59E0B', icon: 'cake' },
      { name: 'Coffee Shops', color: '#92400E', icon: 'coffee' },

      // Shopping
      { name: 'Clothing', color: '#8B5CF6', icon: 'shopping-bag' },
      { name: 'Electronics', color: '#3B82F6', icon: 'device-mobile' },
      { name: 'Home Goods', color: '#6B7280', icon: 'home' },

      // Healthcare
      { name: 'Medical', color: '#EF4444', icon: 'first-aid' },
      { name: 'Pharmacy', color: '#F472B6', icon: 'pill' },
      { name: 'Fitness', color: '#10B981', icon: 'fire' },

      // Entertainment
      { name: 'Movies', color: '#F472B6', icon: 'film' },
      { name: 'Games', color: '#8B5CF6', icon: 'puzzle' },
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

    const systemUserId = '00000000-0000-0000-0000-000000000000' // Use a specific UUID for system categories

    // Insert directly into categories using service role
    console.log('Adding income categories...')
    const { error: incomeError } = await supabase
      .from('categories')
      .insert(incomeCategories.map(category => ({
        ...category,
        type: 'income',
        is_active: true,
        user_id: systemUserId
      })))

    if (incomeError) {
      throw new Error(`Failed to add income categories: ${incomeError.message}`)
    }
    console.log('Successfully added income categories')

    console.log('Adding expense categories...')
    const { error: expenseError } = await supabase
      .from('categories')
      .insert(expenseCategories.map(category => ({
        ...category,
        type: 'expense',
        is_active: true,
        user_id: systemUserId
      })))

    if (expenseError) {
      throw new Error(`Failed to add expense categories: ${expenseError.message}`)
    }
    console.log('Successfully added expense categories')

    // Verify categories were added
    const { data: finalCheck, error: finalError } = await supabase
      .from('categories')
      .select('type, count(*)')
      .eq('user_id', systemUserId)
      .neq('is_active', false)

    if (finalError) {
      throw new Error(`Failed to verify categories: ${finalError.message}`)
    }

    console.log('Final category counts:', finalCheck)
    console.log('Successfully added all categories')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()

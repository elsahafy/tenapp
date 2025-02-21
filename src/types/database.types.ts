export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      recurring_transactions: {
        Row: {
          id: string
          user_id: string
          description: string | null
          amount: number
          type: 'income' | 'expense' | 'transfer'
          category_id: string | null
          account_id: string
          frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          start_date: string
          end_date: string | null
          last_generated: string | null
          next_occurrence: string
          active: boolean
          transfer_account_id: string | null
          day_of_month: number | null
          day_of_week: number | null
          week_of_month: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['recurring_transactions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['recurring_transactions']['Row']>
      }
      accounts: {
        Row: {
          id: string
          name: string
          currency: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
        }
      }
    }
  }
}

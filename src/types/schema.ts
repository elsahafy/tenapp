export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          avatar_url: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          type: 'income' | 'expense'
          created_at: string
          updated_at: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: number
          description: string
          date: string
          created_at: string
          updated_at: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: number
          period: 'monthly' | 'yearly'
          created_at: string
          updated_at: string
        }
      }
      reports: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          report_type: string | null
          parameters: Record<string, any>
          last_generated: string | null
          created_at: string
          updated_at: string
        }
      }
      report_schedules: {
        Row: {
          id: string
          user_id: string
          report_id: string
          frequency: 'daily' | 'weekly' | 'monthly'
          next_run: string
          created_at: string
          updated_at: string
        }
      }
      risk_metrics: {
        Row: {
          id: string
          user_id: string
          overall_score: number
          categories: Record<string, any>[]
          last_updated: string
          created_at: string
          updated_at: string
        }
      }
      risk_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          score: number
          weight: number
          recommendations: string[]
          last_updated: string
          created_at: string
          updated_at: string
        }
      }
      scenarios: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          parameters: Record<string, any>
          results: Record<string, any> | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

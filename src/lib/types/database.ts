import { CurrencyCode } from './currency'

export interface RiskFactor {
  name: string
  weight: number
  score: number
  description: string
}

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          points: number
          requirements: { [key: string]: any }
          icon_url: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          category: string
          points: number
          requirements: { [key: string]: any }
          icon_url: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          points?: number
          requirements?: { [key: string]: any }
          icon_url?: string
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          progress: { current: number; required: number }
          completed_at?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          progress: { current: number; required: number }
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          progress?: { current: number; required: number }
          completed_at?: string
          created_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
        }
      }
      shared_insights: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          category: string
          data: { [key: string]: any }
          visibility: 'public' | 'private' | 'friends'
          created_at: string
          likes_count: number
          comments_count: number
          user_profile?: {
            id: string
            display_name: string
            expertise_level: string
          }
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          category: string
          data?: { [key: string]: any }
          visibility?: 'public' | 'private' | 'friends'
          created_at?: string
          likes_count?: number
          comments_count?: number
          user_profile?: {
            id: string
            display_name: string
            expertise_level: string
          }
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          category?: string
          data?: { [key: string]: any }
          visibility?: 'public' | 'private' | 'friends'
          created_at?: string
          likes_count?: number
          comments_count?: number
          user_profile?: {
            id: string
            display_name: string
            expertise_level: string
          }
        }
      }
      insight_interactions: {
        Row: {
          id: string
          user_id: string
          insight_id: string
          type: 'like' | 'comment' | 'share'
          content?: string
          created_at: string
          user_profile?: {
            id: string
            display_name: string
            expertise_level: string
          }
        }
        Insert: {
          id?: string
          user_id: string
          insight_id: string
          type: 'like' | 'comment' | 'share'
          content?: string
          created_at?: string
          user_profile?: {
            id: string
            display_name: string
            expertise_level: string
          }
        }
        Update: {
          id?: string
          user_id?: string
          insight_id?: string
          type?: 'like' | 'comment' | 'share'
          content?: string
          created_at?: string
          user_profile?: {
            id: string
            display_name: string
            expertise_level: string
          }
        }
      }
      risk_profiles: {
        Row: {
          id: string
          user_id: string
          profile_type: string
          risk_factors: RiskFactor[]
          risk_score: number
          recommendations: string[]
          created_at: string
          updated_at: string
          last_updated: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_type: string
          risk_factors?: RiskFactor[]
          risk_score?: number
          recommendations?: string[]
          created_at?: string
          updated_at?: string
          last_updated?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_type?: string
          risk_factors?: RiskFactor[]
          risk_score?: number
          recommendations?: string[]
          created_at?: string
          updated_at?: string
          last_updated?: string
        }
      }
      risk_metrics: {
        Row: {
          id: string
          user_id: string
          overall_score: number
          last_updated: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          overall_score: number
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          overall_score?: number
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
      }
      risk_categories: {
        Row: {
          id: string
          name: string
          description: string
          score: number
          weight: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          score: number
          weight: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          score?: number
          weight?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          category_id: string | null
          type: 'deposit' | 'withdrawal' | 'transfer'
          status: 'completed' | 'pending' | 'failed'
          amount: number
          currency: string
          description: string
          date: string
          created_at: string
          category_name?: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          category_id?: string | null
          type: 'deposit' | 'withdrawal' | 'transfer'
          status?: 'completed' | 'pending' | 'failed'
          amount: number
          currency?: string
          description: string
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          category_id?: string | null
          type?: 'deposit' | 'withdrawal' | 'transfer'
          status?: 'completed' | 'pending' | 'failed'
          amount?: number
          currency?: string
          description?: string
          date?: string
          created_at?: string
        }
      }
      recurring_transactions: {
        Row: {
          id: string
          user_id: string
          description: string | null
          amount: number
          type: 'deposit' | 'withdrawal' | 'transfer'
          category_id: string | null
          account_id: string
          frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
          interval: number
          start_date: string
          end_date: string | null
          last_date: string | null
          day_of_month: number | null
          day_of_week: number | null
          week_of_month: number | null
          active: boolean
          created_at: string
          updated_at: string
          next_occurrence: string
        }
        Insert: {
          id?: string
          user_id: string
          description?: string | null
          amount: number
          type: 'deposit' | 'withdrawal' | 'transfer'
          category_id?: string | null
          account_id: string
          frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
          interval?: number
          start_date: string
          end_date?: string | null
          last_date?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          week_of_month?: number | null
          active?: boolean
          created_at?: string
          updated_at?: string
          next_occurrence?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string | null
          amount?: number
          type?: 'deposit' | 'withdrawal' | 'transfer'
          category_id?: string | null
          account_id?: string
          frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly'
          interval?: number
          start_date?: string
          end_date?: string | null
          last_date?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          week_of_month?: number | null
          active?: boolean
          created_at?: string
          updated_at?: string
          next_occurrence?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          type: 'checking' | 'savings' | 'investment' | 'credit_card' | 'loan' | 'cash'
          name: string
          balance: number
          current_balance: number
          credit_limit: number | null
          interest_rate: number | null
          due_date: number | null
          is_active: boolean
          currency: CurrencyCode
          institution: string
          account_number: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'checking' | 'savings' | 'investment' | 'credit_card' | 'loan' | 'cash'
          name: string
          balance: number
          current_balance: number
          credit_limit?: number | null
          interest_rate?: number | null
          due_date?: number | null
          is_active?: boolean
          currency: CurrencyCode
          institution: string
          account_number: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'checking' | 'savings' | 'investment' | 'credit_card' | 'loan' | 'cash'
          name?: string
          balance?: number
          current_balance?: number
          credit_limit?: number | null
          interest_rate?: number | null
          due_date?: number | null
          is_active?: boolean
          currency?: CurrencyCode
          institution?: string
          account_number?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'alert' | 'insight' | 'goal' | 'system' | 'social' | 'achievement'
          data: {
            title: string
            message: string
            link?: string
          }
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'alert' | 'insight' | 'goal' | 'system' | 'social' | 'achievement'
          data: {
            title: string
            message: string
            link?: string
          }
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'alert' | 'insight' | 'goal' | 'system' | 'social' | 'achievement'
          data?: {
            title: string
            message: string
            link?: string
          }
          read?: boolean
          created_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          link: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          link?: string | null
          read?: boolean
          created_at?: string
        }
      }
      alert_conditions: {
        Row: {
          id: string
          user_id: string
          type: string
          threshold: number
          timeframe: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          threshold: number
          timeframe: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          threshold?: number
          timeframe?: string
          message?: string
          created_at?: string
        }
      }
      market_data: {
        Row: {
          id: string
          symbol: string
          name: string
          type: 'stock' | 'crypto' | 'forex' | 'commodity'
          price: number
          change_24h: number
          change_percentage_24h: number
          volume_24h: number
          market_cap: number
          additional_data?: Record<string, any>
          last_updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          symbol: string
          name: string
          type: 'stock' | 'crypto' | 'forex' | 'commodity'
          price: number
          change_24h: number
          change_percentage_24h: number
          volume_24h: number
          market_cap: number
          additional_data?: Record<string, any>
          last_updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          symbol?: string
          name?: string
          type?: 'stock' | 'crypto' | 'forex' | 'commodity'
          price?: number
          change_24h?: number
          change_percentage_24h?: number
          volume_24h?: number
          market_cap?: number
          additional_data?: Record<string, any>
          last_updated_at?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          user_id: string
          template_id: string
          parameters: Record<string, any>
          data: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_id: string
          parameters: Record<string, any>
          data: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string
          parameters?: Record<string, any>
          data?: Record<string, any>
          created_at?: string
        }
      }
      report_schedules: {
        Row: {
          id: string
          report_id: string
          frequency: 'daily' | 'weekly' | 'monthly'
          recipients: string[]
          active: boolean
          last_run: string | null
          next_run: string
        }
        Insert: {
          id?: string
          report_id: string
          frequency: 'daily' | 'weekly' | 'monthly'
          recipients: string[]
          active?: boolean
          last_run?: string | null
          next_run: string
        }
        Update: {
          id?: string
          report_id?: string
          frequency?: 'daily' | 'weekly' | 'monthly'
          recipients?: string[]
          active?: boolean
          last_run?: string | null
          next_run?: string
        }
      }
      report_templates: {
        Row: {
          id: string
          name: string
          description: string
          type: 'expense' | 'income' | 'balance' | 'custom'
          query: string
          parameters: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          type: 'expense' | 'income' | 'balance' | 'custom'
          query: string
          parameters: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          type?: 'expense' | 'income' | 'balance' | 'custom'
          query?: string
          parameters?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      custom_reports: {
        Row: {
          id: string
          name: string
          description: string
          sql_query: string
          parameters: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          sql_query: string
          parameters: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          sql_query?: string
          parameters?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      debts: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number
          interest_rate: number
          minimum_payment: number
          due_date: string
          category: string
          notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount: number
          interest_rate: number
          minimum_payment: number
          due_date: string
          category: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: number
          interest_rate?: number
          minimum_payment?: number
          due_date?: string
          category?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          type: 'income' | 'expense'
          icon?: string
          color?: string
          parent_id?: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'income' | 'expense'
          icon?: string
          color?: string
          parent_id?: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'income' | 'expense'
          icon?: string
          color?: string
          parent_id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      insights_view: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          category: string
          data: { [key: string]: any }
          visibility: 'public' | 'private' | 'friends'
          created_at: string
          likes_count: number
          comments_count: number
          shares_count: number
        }
      }
    }
    Functions: {
      increment_points: {
        Args: {
          user_id: string
          points: number
        }
        Returns: number
      }
      generate_risk_profile: {
        Args: {
          profile_data: {
            user_id: string
            profile_type: string
            risk_factors: RiskFactor[]
          }
        }
        Returns: {
          risk_score: number
          recommendations: {
            category: string
            action: string
            priority: 'high' | 'medium' | 'low'
            impact: string
          }[]
        }
      }
    }
    Enums: {
      notification_type: 'alert' | 'insight' | 'goal' | 'system' | 'social' | 'achievement'
      visibility_type: 'public' | 'private' | 'friends'
    }
  }
}

export type Transaction = Database['public']['Tables']['transactions']['Row']
export interface TransactionFilter {
  type: Transaction['type'] | 'all'
  status: Transaction['status'] | 'all'
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year'
  startDate?: string
  endDate?: string
  categoryIds?: string[]
  accountIds?: string[]
  minAmount?: number
  maxAmount?: number
  searchTerm?: string
}

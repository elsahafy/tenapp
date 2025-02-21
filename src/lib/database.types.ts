export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          credit_limit: number | null
          currency: Database["public"]["Enums"]["currency_code"]
          current_balance: number
          due_date: number | null
          id: string
          institution: string | null
          interest_rate: number | null
          is_active: boolean | null
          name: string
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_limit?: number | null
          currency?: Database["public"]["Enums"]["currency_code"]
          current_balance?: number
          due_date?: number | null
          id?: string
          institution?: string | null
          interest_rate?: number | null
          is_active?: boolean | null
          name: string
          type: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credit_limit?: number | null
          currency?: Database["public"]["Enums"]["currency_code"]
          current_balance?: number
          due_date?: number | null
          id?: string
          institution?: string | null
          interest_rate?: number | null
          is_active?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      debt_balance_changes: {
        Row: {
          change_amount: number
          change_date: string
          created_at: string
          current_balance: number
          debt_id: string
          id: string
          notified: boolean | null
          previous_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          change_amount: number
          change_date?: string
          created_at?: string
          current_balance: number
          debt_id: string
          id?: string
          notified?: boolean | null
          previous_balance: number
          updated_at?: string
          user_id: string
        }
        Update: {
          change_amount?: number
          change_date?: string
          created_at?: string
          current_balance?: number
          debt_id?: string
          id?: string
          notified?: boolean | null
          previous_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_balance_changes_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_payments: {
        Row: {
          amount: number
          created_at: string
          debt_id: string
          id: string
          notes: string | null
          payment_date: string
          payment_type: 'scheduled' | 'extra'
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          debt_id: string
          id?: string
          notes?: string | null
          payment_date: string
          payment_type: 'scheduled' | 'extra'
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          debt_id?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_type?: 'scheduled' | 'extra'
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          active: boolean
          created_at: string
          current_balance: number
          due_date: string
          id: string
          interest_rate: number
          minimum_payment: number
          name: string
          type: Database["public"]["Enums"]["debt_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          current_balance: number
          due_date: string
          id?: string
          interest_rate: number
          minimum_payment: number
          name: string
          type: Database["public"]["Enums"]["debt_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          current_balance?: number
          due_date?: string
          id?: string
          interest_rate?: number
          minimum_payment?: number
          name?: string
          type?: Database["public"]["Enums"]["debt_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_progress: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string | null
          goal_id: string
          id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          description?: string | null
          goal_id: string
          id?: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string | null
          goal_id?: string
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_progress_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          auto_contribution: boolean | null
          color: string | null
          contribution_amount: number | null
          contribution_frequency: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          current_amount: number
          description: string | null
          icon: string | null
          id: string
          linked_account_ids: string[] | null
          name: string
          notifications_enabled: boolean | null
          priority: string
          start_date: string
          status: Database["public"]["Enums"]["goal_status"]
          target_amount: number
          target_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_contribution?: boolean | null
          color?: string | null
          contribution_amount?: number | null
          contribution_frequency?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          current_amount?: number
          description?: string | null
          icon?: string | null
          id?: string
          linked_account_ids?: string[] | null
          name: string
          notifications_enabled?: boolean | null
          priority: string
          start_date: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_amount: number
          target_date: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_contribution?: boolean | null
          color?: string | null
          contribution_amount?: number | null
          contribution_frequency?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          current_amount?: number
          description?: string | null
          icon?: string | null
          id?: string
          linked_account_ids?: string[] | null
          name?: string
          notifications_enabled?: boolean | null
          priority?: string
          start_date?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target_amount?: number
          target_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      insights: {
        Row: {
          action_items: Json
          created_at: string
          data: Json
          description: string
          id: string
          importance: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_items?: Json
          created_at?: string
          data: Json
          description: string
          id?: string
          importance: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_items?: Json
          created_at?: string
          data?: Json
          description?: string
          id?: string
          importance?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          created_at: string
          data: Json | null
          email: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          email: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          email?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_settings: {
        Row: {
          constraints: Json | null
          created_at: string
          id: string
          investment_horizon: number | null
          rebalancing_frequency: string | null
          risk_tolerance: number | null
          target_allocation: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          constraints?: Json | null
          created_at?: string
          id?: string
          investment_horizon?: number | null
          rebalancing_frequency?: string | null
          risk_tolerance?: number | null
          target_allocation?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          constraints?: Json | null
          created_at?: string
          id?: string
          investment_horizon?: number | null
          rebalancing_frequency?: string | null
          risk_tolerance?: number | null
          target_allocation?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_snapshots: {
        Row: {
          allocation: Json
          created_at: string
          id: string
          performance_metrics: Json
          risk_metrics: Json
          timestamp: string
          total_value: number
          user_id: string
        }
        Insert: {
          allocation: Json
          created_at?: string
          id?: string
          performance_metrics: Json
          risk_metrics: Json
          timestamp: string
          total_value: number
          user_id: string
        }
        Update: {
          allocation?: Json
          created_at?: string
          id?: string
          performance_metrics?: Json
          risk_metrics?: Json
          timestamp?: string
          total_value?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          preferred_currency:
            | Database["public"]["Enums"]["currency_code"]
            | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          preferred_currency?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          preferred_currency?:
            | Database["public"]["Enums"]["currency_code"]
            | null
          updated_at?: string
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          account_id: string
          active: boolean | null
          amount: number
          category_id: string | null
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          description: string | null
          end_date: string | null
          frequency: Database["public"]["Enums"]["recurring_frequency"]
          id: string
          last_generated: string | null
          next_occurrence: string
          start_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
          week_of_month: number | null
        }
        Insert: {
          account_id: string
          active?: boolean | null
          amount: number
          category_id?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string | null
          end_date?: string | null
          frequency: Database["public"]["Enums"]["recurring_frequency"]
          id?: string
          last_generated?: string | null
          next_occurrence: string
          start_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
          week_of_month?: number | null
        }
        Update: {
          account_id?: string
          active?: boolean | null
          amount?: number
          category_id?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          description?: string | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurring_frequency"]
          id?: string
          last_generated?: string | null
          next_occurrence?: string
          start_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
          week_of_month?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_profiles: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          profile_type: string
          recommendations: Json | null
          risk_factors: Json
          risk_score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          profile_type: string
          recommendations?: Json | null
          risk_factors: Json
          risk_score: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          profile_type?: string
          recommendations?: Json | null
          risk_factors?: Json
          risk_score?: number
          user_id?: string
        }
        Relationships: []
      }
      scenario_analyses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parameters: Json
          results: Json | null
          scenario_type: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parameters: Json
          results?: Json | null
          scenario_type: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parameters?: Json
          results?: Json | null
          scenario_type?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parameters: Json
          results: Json | null
          scenario_type: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parameters?: Json
          results?: Json | null
          scenario_type: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parameters?: Json
          results?: Json | null
          scenario_type?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          date: string
          description: string | null
          id: string
          status: string
          subcategory_id: string | null
          transfer_account_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          date: string
          description?: string | null
          id?: string
          status: string
          subcategory_id?: string | null
          transfer_account_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string | null
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          date?: string
          description?: string | null
          id?: string
          status?: string
          subcategory_id?: string | null
          transfer_account_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transfer_account_id_fkey"
            columns: ["transfer_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_settings: {
        Row: {
          bill_reminders: boolean | null
          budget_alerts: boolean | null
          created_at: string
          debt_reminders: boolean | null
          email_notifications: boolean | null
          goal_reminders: boolean | null
          id: string
          investment_alerts: boolean | null
          push_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bill_reminders?: boolean | null
          budget_alerts?: boolean | null
          created_at?: string
          debt_reminders?: boolean | null
          email_notifications?: boolean | null
          goal_reminders?: boolean | null
          id?: string
          investment_alerts?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bill_reminders?: boolean | null
          budget_alerts?: boolean | null
          created_at?: string
          debt_reminders?: boolean | null
          email_notifications?: boolean | null
          goal_reminders?: boolean | null
          id?: string
          investment_alerts?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      insights_view: {
        Row: {
          action_items: Json | null
          created_at: string | null
          data: Json | null
          description: string | null
          email: string | null
          first_name: string | null
          id: string | null
          importance: string | null
          last_name: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_portfolio_metrics: {
        Args: {
          portfolio_data: Json
          start_date: string
          end_date: string
        }
        Returns: Json
      }
    }
    Enums: {
      account_type:
        | "checking"
        | "savings"
        | "credit_card"
        | "investment"
        | "loan"
        | "cash"
      currency_code:
        | "USD"
        | "EUR"
        | "GBP"
        | "AED"
        | "SAR"
        | "QAR"
        | "BHD"
        | "KWD"
        | "OMR"
        | "EGP"
      debt_type:
        | "mortgage"
        | "credit_card"
        | "student_loan"
        | "auto_loan"
        | "personal"
      goal_status:
        | "not_started"
        | "in_progress"
        | "on_track"
        | "behind"
        | "achieved"
        | "cancelled"
      recurring_frequency:
        | "daily"
        | "weekly"
        | "biweekly"
        | "monthly"
        | "quarterly"
        | "yearly"
      transaction_type: "income" | "expense" | "transfer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

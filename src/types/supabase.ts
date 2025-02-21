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
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: Database["public"]["Enums"]["account_type"]
          currency: Database["public"]["Enums"]["currency_code"]
          current_balance: number
          credit_limit: number | null
          interest_rate: number | null
          due_date: number | null
          min_payment_amount: number | null
          min_payment_percentage: number | null
          emi_enabled: boolean
          is_active: boolean
          institution: string | null
          loan_term: number | null
          loan_start_date: string | null
          loan_end_date: string | null
          total_loan_amount: number | null
          monthly_installment: number | null
          collateral: string | null
          loan_purpose: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: Database["public"]["Enums"]["account_type"]
          currency: Database["public"]["Enums"]["currency_code"]
          current_balance?: number
          credit_limit?: number | null
          interest_rate?: number | null
          due_date?: number | null
          min_payment_amount?: number | null
          min_payment_percentage?: number | null
          emi_enabled?: boolean
          is_active?: boolean
          institution?: string | null
          loan_term?: number | null
          loan_start_date?: string | null
          loan_end_date?: string | null
          total_loan_amount?: number | null
          monthly_installment?: number | null
          collateral?: string | null
          loan_purpose?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: Database["public"]["Enums"]["account_type"]
          currency?: Database["public"]["Enums"]["currency_code"]
          current_balance?: number
          credit_limit?: number | null
          interest_rate?: number | null
          due_date?: number | null
          min_payment_amount?: number | null
          min_payment_percentage?: number | null
          emi_enabled?: boolean
          is_active?: boolean
          institution?: string | null
          loan_term?: number | null
          loan_start_date?: string | null
          loan_end_date?: string | null
          total_loan_amount?: number | null
          monthly_installment?: number | null
          collateral?: string | null
          loan_purpose?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          transfer_account_id: string | null
          category_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          amount: number
          currency: Database["public"]["Enums"]["currency_code"]
          description: string | null
          date: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          transfer_account_id?: string | null
          category_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          amount: number
          currency: Database["public"]["Enums"]["currency_code"]
          description?: string | null
          date: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          transfer_account_id?: string | null
          category_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          amount?: number
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string | null
          date?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_type: "checking" | "savings" | "credit_card" | "investment" | "loan" | "cash"
      currency_code: "USD" | "EUR" | "GBP" | "AED" | "SAR" | "QAR" | "BHD" | "KWD" | "OMR" | "EGP"
      transaction_type: "income" | "expense" | "transfer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
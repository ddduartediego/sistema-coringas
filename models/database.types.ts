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
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          name: string
          nickname: string
          status: string
          role: string
          shirt_size: string
          birth_date: string | null
          cpf: string | null
          gender: string | null
          phone: string | null
          profession: string | null
          is_admin: boolean
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          name: string
          nickname?: string
          status?: string
          role?: string
          shirt_size?: string
          birth_date?: string | null
          cpf?: string | null
          gender?: string | null
          phone?: string | null
          profession?: string | null
          is_admin?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          name?: string
          nickname?: string
          status?: string
          role?: string
          shirt_size?: string
          birth_date?: string | null
          cpf?: string | null
          gender?: string | null
          phone?: string | null
          profession?: string | null
          is_admin?: boolean
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      config_status: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      config_roles: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
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
      [_ in never]: never
    }
  }
} 
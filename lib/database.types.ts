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
      config_roles: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      config_status: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_game: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      equipe_integrantes: {
        Row: {
          created_at: string | null
          equipe_id: string
          id: string
          integrante_id: string
          is_owner: boolean
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          equipe_id: string
          id?: string
          integrante_id: string
          is_owner?: boolean
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          equipe_id?: string
          id?: string
          integrante_id?: string
          is_owner?: boolean
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipe_integrantes_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "game_equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipe_integrantes_integrante_id_fkey"
            columns: ["integrante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      game_equipes: {
        Row: {
          created_at: string | null
          game_id: string
          id: string
          lider_id: string
          nome: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          game_id: string
          id?: string
          lider_id: string
          nome: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          game_id?: string
          id?: string
          lider_id?: string
          nome?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_equipes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_equipes_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      games: {
        Row: {
          created_at: string | null
          data_inicio: string | null
          descricao: string
          descricao_curta: string
          id: string
          imagem_url: string | null
          quantidade_integrantes: number
          status: string
          tipo: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_inicio?: string | null
          descricao: string
          descricao_curta: string
          id?: string
          imagem_url?: string | null
          quantidade_integrantes?: number
          status?: string
          tipo?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_inicio?: string | null
          descricao?: string
          descricao_curta?: string
          id?: string
          imagem_url?: string | null
          quantidade_integrantes?: number
          status?: string
          tipo?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          bairro: string | null
          birth_date: string | null
          blood_type: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf: string | null
          created_at: string
          email: string
          gender: string | null
          id: string
          is_admin: boolean
          is_approved: boolean
          is_blood_donor: boolean | null
          name: string
          nickname: string | null
          numero: string | null
          phone: string | null
          profession: string | null
          role: string | null
          shirt_size: string | null
          status: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          bairro?: string | null
          birth_date?: string | null
          blood_type?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          gender?: string | null
          id?: string
          is_admin?: boolean
          is_approved?: boolean
          is_blood_donor?: boolean | null
          name: string
          nickname?: string | null
          numero?: string | null
          phone?: string | null
          profession?: string | null
          role?: string | null
          shirt_size?: string | null
          status?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          bairro?: string | null
          birth_date?: string | null
          blood_type?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          gender?: string | null
          id?: string
          is_admin?: boolean
          is_approved?: boolean
          is_blood_donor?: boolean | null
          name?: string
          nickname?: string | null
          numero?: string | null
          phone?: string | null
          profession?: string | null
          role?: string | null
          shirt_size?: string | null
          status?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export default Database;

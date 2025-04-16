export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      active_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          last_seen: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          last_seen?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          last_seen?: string
          user_id?: string
        }
        Relationships: []
      }
      cobranca_integrantes: {
        Row: {
          cobranca_id: string
          created_at: string | null
          data_pagamento: string | null
          forma_pagamento_id: string | null
          id: string
          integrante_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          cobranca_id: string
          created_at?: string | null
          data_pagamento?: string | null
          forma_pagamento_id?: string | null
          id?: string
          integrante_id: string
          status: string
          updated_at?: string | null
        }
        Update: {
          cobranca_id?: string
          created_at?: string | null
          data_pagamento?: string | null
          forma_pagamento_id?: string | null
          id?: string
          integrante_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cobranca_integrantes_cobranca_id_fkey"
            columns: ["cobranca_id"]
            isOneToOne: false
            referencedRelation: "cobrancas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobranca_integrantes_forma_pagamento_id_fkey"
            columns: ["forma_pagamento_id"]
            isOneToOne: false
            referencedRelation: "config_payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobranca_integrantes_integrante_id_fkey"
            columns: ["integrante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cobranca_parcelas: {
        Row: {
          ano_vencimento: number
          cobranca_id: string
          created_at: string | null
          id: string
          mes_vencimento: number
          numero_parcela: number
          valor: number
        }
        Insert: {
          ano_vencimento: number
          cobranca_id: string
          created_at?: string | null
          id?: string
          mes_vencimento: number
          numero_parcela: number
          valor: number
        }
        Update: {
          ano_vencimento?: number
          cobranca_id?: string
          created_at?: string | null
          id?: string
          mes_vencimento?: number
          numero_parcela?: number
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cobranca_parcelas_cobranca_id_fkey"
            columns: ["cobranca_id"]
            isOneToOne: false
            referencedRelation: "cobrancas"
            referencedColumns: ["id"]
          },
        ]
      }
      cobrancas: {
        Row: {
          ano_vencimento: number
          created_at: string | null
          id: string
          is_parcelado: boolean | null
          mes_vencimento: number
          nome: string
          parcelas: number | null
          updated_at: string | null
          valor: number
        }
        Insert: {
          ano_vencimento: number
          created_at?: string | null
          id?: string
          is_parcelado?: boolean | null
          mes_vencimento: number
          nome: string
          parcelas?: number | null
          updated_at?: string | null
          valor: number
        }
        Update: {
          ano_vencimento?: number
          created_at?: string | null
          id?: string
          is_parcelado?: boolean | null
          mes_vencimento?: number
          nome?: string
          parcelas?: number | null
          updated_at?: string | null
          valor?: number
        }
        Relationships: []
      }
      config_payment_methods: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
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
          descricao: string | null
          id: string
          is_active: boolean | null
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean | null
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean | null
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      equipe_etapas: {
        Row: {
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          equipe_id: string
          etapa_id: string
          id: string
          pontuacao: number
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          equipe_id: string
          etapa_id: string
          id?: string
          pontuacao?: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          equipe_id?: string
          etapa_id?: string
          id?: string
          pontuacao?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipe_etapas_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "game_equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipe_etapas_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
        ]
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
          },
        ]
      }
      equipe_quests: {
        Row: {
          avaliacao: string | null
          avaliado_por: string | null
          created_at: string | null
          data_inicio: string | null
          data_resposta: string | null
          equipe_id: string
          feedback: string | null
          id: string
          pontos_obtidos: number | null
          quest_id: string
          resposta: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          avaliacao?: string | null
          avaliado_por?: string | null
          created_at?: string | null
          data_inicio?: string | null
          data_resposta?: string | null
          equipe_id: string
          feedback?: string | null
          id?: string
          pontos_obtidos?: number | null
          quest_id: string
          resposta?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          avaliacao?: string | null
          avaliado_por?: string | null
          created_at?: string | null
          data_inicio?: string | null
          data_resposta?: string | null
          equipe_id?: string
          feedback?: string | null
          id?: string
          pontos_obtidos?: number | null
          quest_id?: string
          resposta?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipe_quests_avaliado_por_fkey"
            columns: ["avaliado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipe_quests_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "game_equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipe_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas: {
        Row: {
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          nome: string
          ordem: number
          pontuacao: number
          quest_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          nome: string
          ordem: number
          pontuacao?: number
          quest_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          pontuacao?: number
          quest_id?: string
          updated_at?: string | null
        }
        Relationships: []
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
          },
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
          avatar_url: string | null
          bairro: string | null
          birth_date: string | null
          cep: string | null
          complemento: string | null
          cpf: string | null
          created_at: string
          email: string
          estado: string | null
          gender: string | null
          id: string
          is_admin: boolean
          is_approved: boolean
          is_blood_donor: boolean | null
          is_leader: boolean | null
          last_blood_donation: string | null
          localidade: string | null
          logradouro: string | null
          name: string
          naturalidade: string | null
          nickname: string | null
          nome_mae: string | null
          nome_pai: string | null
          numero: string | null
          phone: string | null
          profession: string | null
          rg: string | null
          role: string | null
          shirt_size: string | null
          status: string | null
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          bairro?: string | null
          birth_date?: string | null
          cep?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          estado?: string | null
          gender?: string | null
          id?: string
          is_admin?: boolean
          is_approved?: boolean
          is_blood_donor?: boolean | null
          is_leader?: boolean | null
          last_blood_donation?: string | null
          localidade?: string | null
          logradouro?: string | null
          name: string
          naturalidade?: string | null
          nickname?: string | null
          nome_mae?: string | null
          nome_pai?: string | null
          numero?: string | null
          phone?: string | null
          profession?: string | null
          rg?: string | null
          role?: string | null
          shirt_size?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          bairro?: string | null
          birth_date?: string | null
          cep?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          estado?: string | null
          gender?: string | null
          id?: string
          is_admin?: boolean
          is_approved?: boolean
          is_blood_donor?: boolean | null
          is_leader?: boolean | null
          last_blood_donation?: string | null
          localidade?: string | null
          logradouro?: string | null
          name?: string
          naturalidade?: string | null
          nickname?: string | null
          nome_mae?: string | null
          nome_pai?: string | null
          numero?: string | null
          phone?: string | null
          profession?: string | null
          rg?: string | null
          role?: string | null
          shirt_size?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      quests: {
        Row: {
          arquivo_pdf: string | null
          chave: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string
          game_id: string
          id: string
          numero: number | null
          pontos: number
          status: string
          tipo: string
          titulo: string
          updated_at: string | null
          visivel: boolean | null
        }
        Insert: {
          arquivo_pdf?: string | null
          chave?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao: string
          game_id: string
          id?: string
          numero?: number | null
          pontos?: number
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string | null
          visivel?: boolean | null
        }
        Update: {
          arquivo_pdf?: string | null
          chave?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string
          game_id?: string
          id?: string
          numero?: number | null
          pontos?: number
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string | null
          visivel?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "quests_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_config: {
        Row: {
          created_at: string | null
          id: string
          last_connection: string | null
          status: string
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_connection?: string | null
          status: string
          token: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_connection?: string | null
          status?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      execute_sql: {
        Args: { sql_query: string }
        Returns: Json
      }
      listar_equipes_com_detalhes: {
        Args: { p_game_id: string }
        Returns: {
          id: string
          nome: string
          status: string
          lider_id: string
          lider_nome: string
          total_integrantes: number
        }[]
      }
      verificar_participacao_em_game: {
        Args: { p_user_id: string; p_game_id: string }
        Returns: {
          equipe_id: string
          equipe_nome: string
          equipe_status: string
          integrante_status: string
          is_owner: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

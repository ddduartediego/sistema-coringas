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
      cobrancas: {
        Row: {
          id: string;
          nome: string;
          valor: number;
          mes_vencimento: number;
          ano_vencimento: number;
          is_parcelado: boolean;
          parcelas: number | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          valor: number;
          mes_vencimento: number;
          ano_vencimento: number;
          is_parcelado: boolean;
          parcelas?: number | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          valor?: number;
          mes_vencimento?: number;
          ano_vencimento?: number;
          is_parcelado?: boolean;
          parcelas?: number | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      cobranca_integrantes: {
        Row: {
          id: string;
          cobranca_id: string;
          integrante_id: string;
          status: string;
          data_pagamento: string | null;
          metodo_pagamento_id: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          cobranca_id: string;
          integrante_id: string;
          status: string;
          data_pagamento?: string | null;
          metodo_pagamento_id?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          cobranca_id?: string;
          integrante_id?: string;
          status?: string;
          data_pagamento?: string | null;
          metodo_pagamento_id?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      cobranca_parcelas: {
        Row: {
          id: string;
          cobranca_id: string;
          numero_parcela: number;
          mes_vencimento: number;
          ano_vencimento: number;
          valor: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          cobranca_id: string;
          numero_parcela: number;
          mes_vencimento: number;
          ano_vencimento: number;
          valor: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          cobranca_id?: string;
          numero_parcela?: number;
          mes_vencimento?: number;
          ano_vencimento?: number;
          valor?: number;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      config_payment_methods: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          active: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      config_status: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          color: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          avatar_url: string | null;
          status: string | null;
          nickname: string | null;
          is_admin: boolean;
          rg: string | null;
          naturalidade: string | null;
          nome_mae: string | null;
          nome_pai: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email?: string | null;
          avatar_url?: string | null;
          status?: string | null;
          nickname?: string | null;
          is_admin?: boolean;
          rg?: string | null;
          naturalidade?: string | null;
          nome_mae?: string | null;
          nome_pai?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string | null;
          avatar_url?: string | null;
          status?: string | null;
          nickname?: string | null;
          is_admin?: boolean;
          rg?: string | null;
          naturalidade?: string | null;
          nome_mae?: string | null;
          nome_pai?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
    };
  };
} 
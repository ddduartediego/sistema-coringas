export interface Database {
  public: {
    Tables: {
      cobranca_integrantes: {
        Row: {
          id: string;
          nome: string;
          valor: number;
          mes_vencimento: number;
          ano_vencimento: number;
          status: 'Pendente' | 'Pago' | 'Atrasado';
          data_pagamento?: string;
          forma_pagamento_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          valor: number;
          mes_vencimento: number;
          ano_vencimento: number;
          status?: 'Pendente' | 'Pago' | 'Atrasado';
          data_pagamento?: string;
          forma_pagamento_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          valor?: number;
          mes_vencimento?: number;
          ano_vencimento?: number;
          status?: 'Pendente' | 'Pago' | 'Atrasado';
          data_pagamento?: string;
          forma_pagamento_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      config_payment_methods: {
        Row: {
          id: string;
          name: string;
          description?: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
} 
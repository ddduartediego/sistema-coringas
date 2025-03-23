import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/database.types";

// Validar que as variáveis de ambiente estão definidas
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('ERRO: NEXT_PUBLIC_SUPABASE_URL não está definido');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('ERRO: NEXT_PUBLIC_SUPABASE_ANON_KEY não está definido');
}

console.log('Inicializando cliente Supabase com URL:', 
  process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...');

// Inicializar o cliente Supabase
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: (...args) => {
        return fetch(...args);
      }
    }
  }
); 
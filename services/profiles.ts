import { supabase } from '@/lib/supabase/client';

interface Profile {
  id: string;
  name: string;
  whatsapp_number: string | null;
}

export class ProfileService {
  async getProfilesWithWhatsApp(): Promise<Profile[]> {
    try {
      // @ts-ignore - temporariamente ignorando o erro do whatsapp_number até que o tipo seja atualizado
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, whatsapp_number')
        .not('whatsapp_number', 'is', null)
        .order('name');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
      throw error;
    }
  }
} 
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Equipe {
  id: string;
  nome: string;
  status: string;
  lider_id: string;
  lider_nome: string;
  total_integrantes: number;
}

interface ListaEquipesInscritasProps {
  gameId: string;
}

export default function ListaEquipesInscritas({ gameId }: ListaEquipesInscritasProps) {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarPendentes, setMostrarPendentes] = useState(true);
  const [mostrarAtivas, setMostrarAtivas] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!gameId) return;
    
    async function carregarEquipes() {
      try {
        setLoading(true);
        console.log('Iniciando carregamento de equipes para o game:', gameId);
        
        // Verificar se temos um ID de game válido
        if (!gameId || typeof gameId !== 'string') {
          console.error('ID de game inválido:', gameId);
          throw new Error(`ID de game inválido: ${gameId}`);
        }
        
        // Verificar cliente Supabase
        if (!supabase || !supabase.from) {
          console.error('Cliente Supabase inválido');
          throw new Error('Cliente Supabase não foi inicializado corretamente');
        }
        
        console.log('Buscando equipes diretamente...');
        console.log('URL do Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        
        // Tentar o método direto primeiro (devido ao erro com RPC)
        const { data: equipesDiretas, error: errorDireto } = await supabase
          .from('game_equipes')
          .select('id, nome, status, lider_id')
          .eq('game_id', gameId)
          .order('created_at', { ascending: false });
        
        if (errorDireto) {
          console.error('Erro ao buscar equipes diretamente:', errorDireto);
          // Logs detalhados para erros
          if (errorDireto.code) {
            console.error(`Código do erro: ${errorDireto.code}`);
          }
          if (errorDireto.details) {
            console.error(`Detalhes do erro: ${errorDireto.details}`);
          }
          if (errorDireto.hint) {
            console.error(`Dica do erro: ${errorDireto.hint}`);
          }
          throw new Error(`Falha ao carregar equipes: ${errorDireto.message || 'Erro desconhecido'}`);
        }
        
        if (!equipesDiretas || equipesDiretas.length === 0) {
          console.log('Nenhuma equipe encontrada para este game');
          setEquipes([]);
          return;
        }
        
        console.log(`Encontradas ${equipesDiretas.length} equipes, processando...`);
        
        // Processar cada equipe manualmente
        const equipesProcessadas = await Promise.all(equipesDiretas.map(async (equipe) => {
          // Buscar informações do líder
          const { data: liderData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', equipe.lider_id)
            .single();
            
          // Contar integrantes
          const { count: totalIntegrantes } = await supabase
            .from('equipe_integrantes')
            .select('id', { count: 'exact', head: true })
            .eq('equipe_id', equipe.id);
            
          return {
            id: equipe.id,
            nome: equipe.nome,
            status: equipe.status,
            lider_id: equipe.lider_id,
            lider_nome: liderData?.name || 'Desconhecido',
            total_integrantes: totalIntegrantes || 0
          };
        }));
        
        console.log('Equipes processadas com sucesso:', equipesProcessadas);
        setEquipes(equipesProcessadas);
      } catch (error: any) {
        console.error('Erro ao carregar equipes:', error);
        let mensagemErro = "Não foi possível carregar as equipes inscritas.";
        
        if (error instanceof Error) {
          mensagemErro = error.message;
        } else if (typeof error === 'object' && error !== null) {
          mensagemErro = JSON.stringify(error);
        }
        
        toast({
          title: 'Erro ao carregar equipes',
          description: mensagemErro,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    
    carregarEquipes();
  }, [gameId, toast]);
  
  // Filtrar equipes por status
  const equipesPendentes = equipes.filter(equipe => equipe.status === 'pendente');
  const equipesAtivas = equipes.filter(equipe => equipe.status === 'ativa');
  
  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Equipes Inscritas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-primary-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (equipes.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Equipes Inscritas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Users className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Nenhuma equipe inscrita neste game ainda.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Equipes Inscritas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Equipes pendentes */}
        {equipesPendentes.length > 0 && (
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer mb-2"
              onClick={() => setMostrarPendentes(!mostrarPendentes)}
            >
              <h3 className="text-lg font-medium flex items-center">
                <Badge variant="outline" className="mr-2 bg-yellow-50 text-yellow-700 border-yellow-200">
                  {equipesPendentes.length}
                </Badge>
                Equipes Pendentes
              </h3>
              <Button variant="ghost" size="sm">
                {mostrarPendentes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            
            {mostrarPendentes && (
              <div className="space-y-2">
                {equipesPendentes.map(equipe => (
                  <div 
                    key={equipe.id} 
                    className="p-3 rounded-md border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="font-medium">{equipe.nome}</h4>
                        <p className="text-sm text-gray-600">
                          Líder: {equipe.lider_nome}
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0 flex items-center">
                        <span className="mr-3 text-sm text-gray-600">
                          <Users className="inline h-4 w-4 mr-1" />
                          {equipe.total_integrantes} integrantes
                        </span>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Pendente
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Equipes ativas */}
        {equipesAtivas.length > 0 && (
          <div>
            <div 
              className="flex items-center justify-between cursor-pointer mb-2"
              onClick={() => setMostrarAtivas(!mostrarAtivas)}
            >
              <h3 className="text-lg font-medium flex items-center">
                <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 border-green-200">
                  {equipesAtivas.length}
                </Badge>
                Equipes Ativas
              </h3>
              <Button variant="ghost" size="sm">
                {mostrarAtivas ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            
            {mostrarAtivas && (
              <div className="space-y-2">
                {equipesAtivas.map(equipe => (
                  <div 
                    key={equipe.id} 
                    className="p-3 rounded-md border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="font-medium">{equipe.nome}</h4>
                        <p className="text-sm text-gray-600">
                          Líder: {equipe.lider_nome}
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0 flex items-center">
                        <span className="mr-3 text-sm text-gray-600">
                          <Users className="inline h-4 w-4 mr-1" />
                          {equipe.total_integrantes} integrantes
                        </span>
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          Ativa
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
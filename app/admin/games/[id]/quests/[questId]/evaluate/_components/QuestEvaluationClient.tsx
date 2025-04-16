'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Database } from '@/lib/database.types';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, X, AlertCircle, CheckCheck, XCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

// Reutilizar tipos definidos na page.tsx ou redefinir se necessário
type QuestWithChave = Database['public']['Tables']['quests']['Row'] & {
    chave: string | null;
};

type EquipeQuestWithTeamName = Database['public']['Tables']['equipe_quests']['Row'] & {
    game_equipes: {
        id: string;
        nome: string;
    } | null;
    // Incluir explicitamente as colunas que vamos usar
    id: string;
    equipe_id: string;
    quest_id: string;
    status: string;
    resposta?: string | null;
    avaliacao?: string | null;
    data_resposta?: string | null;
    pontos_obtidos?: number | null;
};

interface QuestEvaluationClientProps {
    quest: QuestWithChave;
    teamResponses: EquipeQuestWithTeamName[];
    gameId: string;
}

export default function QuestEvaluationClient({ quest, teamResponses, gameId }: QuestEvaluationClientProps) {
    const router = useRouter();
    const supabase = createClientSupabaseClient();
    const { toast } = useToast();

    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    // --- Funções de Helper para Badges ---
    const renderStatusBadge = (status: string | null) => {
        switch (status) {
            case 'respondido':
                return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">Respondido</Badge>;
            case 'concluida':
                return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Concluída</Badge>;
            case 'pendente':
                 return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
            default:
                return <Badge variant="secondary">{status || '-'}</Badge>;
        }
    };

    const renderAvaliacaoBadge = (avaliacao: string | null) => {
         switch (avaliacao) {
            case 'certo':
                return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 flex items-center"><Check className="h-3 w-3 mr-1"/> Certo</Badge>;
            case 'errado':
                return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 flex items-center"><X className="h-3 w-3 mr-1"/> Errado</Badge>;
            default:
                return <span className="text-xs text-gray-500">-</span>;
        }
    };
    // --- Fim Funções de Helper ---

    const formatarData = (dataString: string | null) => {
        if (!dataString) return '-';
        try {
            return format(new Date(dataString), "dd/MM/yy HH:mm", { locale: ptBR });
        } catch (e) {
            console.error("Erro ao formatar data:", dataString, e);
            return 'Data inválida';
        }
    };

    const handleCheckboxChange = (equipeQuestId: string, checked: boolean | 'indeterminate') => {
        setSelectedRows(prev => {
            const next = new Set(prev);
            if (checked === true) {
                next.add(equipeQuestId);
            } else {
                next.delete(equipeQuestId);
            }
            return next;
        });
    };

    const handleSelectAll = (checked: boolean | 'indeterminate') => {
        if (checked === true) {
            const allRespondidoIds = teamResponses
                .filter(tr => tr.status === 'respondido')
                .map(tr => tr.id);
            setSelectedRows(new Set(allRespondidoIds));
        } else {
            setSelectedRows(new Set());
        }
    };

    const isAllSelected = teamResponses.length > 0 && 
                          selectedRows.size === teamResponses.filter(tr => tr.status === 'respondido').length;
    const isIndeterminate = selectedRows.size > 0 && !isAllSelected;

    // --- Lógica de Avaliação --- 
    const performEvaluation = async (ids: string[], isCorrect: boolean) => {
        if (ids.length === 0) return; // Não faz nada se não houver IDs

        setIsUpdating(true);
        console.log(`Avaliando ${ids.length} respostas como ${isCorrect ? 'Correto' : 'Errado'}... IDs:`, ids);
        const avaliacaoValue = isCorrect ? 'certo' : 'errado';
        const pontosValue = isCorrect ? quest.pontos : 0;

        const updatePayload = { 
            status: 'concluida', 
            avaliacao: avaliacaoValue,
            pontos_obtidos: pontosValue
        };

        console.log("Payload para update:", updatePayload);

        try {
            // *** Chamada real ao Supabase ***
            const { error } = await supabase
              .from('equipe_quests')
              .update(updatePayload)
              .in('id', ids); // Usar .in() para atualizar múltiplos IDs
            
            // Verificar erro retornado pelo Supabase
            if (error) {
              console.error("Erro retornado pelo Supabase ao avaliar:", error);
              throw error; // Lança o erro para o bloco catch
            }

            console.log(`Avaliação de ${ids.length} registro(s) concluída com sucesso.`);

            toast({
                title: "Avaliação Registrada",
                description: `${ids.length} resposta(s) marcada(s) como ${avaliacaoValue}. Status atualizado para Concluída.`,
            });
            setSelectedRows(new Set()); // Limpar seleção
            router.refresh(); // Recarregar dados da página para refletir mudanças

        } catch (error: any) {
            console.error("Erro no bloco try/catch ao avaliar respostas:", error);
            toast({
                title: "Erro na Avaliação",
                description: error.message || "Não foi possível registrar a avaliação.",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleEvaluate = (equipeQuestId: string, isCorrect: boolean) => {
        performEvaluation([equipeQuestId], isCorrect);
    };

    const handleBatchEvaluate = (isCorrect: boolean) => {
        if (selectedRows.size === 0) return;
        performEvaluation(Array.from(selectedRows), isCorrect);
    };
    // --- Fim Lógica de Avaliação ---

    // --- Dados para o Ranking --- 
    const rankingData = useMemo(() => {
        return teamResponses
            .filter(tr => tr.avaliacao === 'certo' && tr.data_resposta)
            .sort((a, b) => new Date(a.data_resposta!).getTime() - new Date(b.data_resposta!).getTime());
    }, [teamResponses]);
    // --- Fim Dados para o Ranking ---

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-200">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Avaliar Respostas</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Quest: <span className="font-medium text-primary-700">{quest.titulo}</span>
                    </p>
                </div>
                <Button 
                    onClick={() => router.push(`/admin/games/${gameId}/quests` as any)}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Quests
                </Button>
            </div>

            <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                    <CardTitle className="text-lg text-blue-900">Resposta Correta (Chave)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-md font-semibold text-blue-900 bg-white p-3 rounded border border-blue-100 shadow-sm">
                        {quest.chave || "(Nenhuma chave definida para esta quest)"}
                    </p>
                </CardContent>
            </Card>

            {teamResponses.length === 0 && (
                <Alert variant="default">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Nenhuma Resposta</AlertTitle>
                    <AlertDescription>
                        Nenhuma equipe enviou uma resposta para esta quest ainda.
                    </AlertDescription>
                </Alert>
            )}

            {teamResponses.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                         <div>
                             <CardTitle>Respostas das Equipes</CardTitle>
                             <CardDescription>Selecione as respostas para avaliar em lote ou avalie individualmente.</CardDescription>
                         </div>
                        <div className="flex flex-wrap justify-start md:justify-end space-x-2">
                             <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => handleBatchEvaluate(true)}
                                disabled={selectedRows.size === 0 || isUpdating}
                                className="border-green-300 text-green-700 hover:bg-green-50"
                            >
                                <CheckCheck className="mr-2 h-4 w-4"/>
                                Marcar Seleção como Certo
                            </Button>
                             <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => handleBatchEvaluate(false)}
                                disabled={selectedRows.size === 0 || isUpdating}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                                <XCircle className="mr-2 h-4 w-4"/>
                                Marcar Seleção como Errado
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-gray-100">
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox 
                                                onCheckedChange={handleSelectAll}
                                                checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
                                                aria-label="Selecionar todas as linhas respondidas"
                                                disabled={teamResponses.filter(tr => tr.status === 'respondido').length === 0}
                                            />
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700">Equipe</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Avaliação</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Resposta Enviada</TableHead>
                                        <TableHead className="w-[150px] font-semibold text-gray-700">Data Resposta</TableHead>
                                        <TableHead className="text-right w-[180px] font-semibold text-gray-700">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teamResponses.map((tr) => (
                                        <TableRow key={tr.id} data-state={selectedRows.has(tr.id) ? 'selected' : ''} className="hover:bg-gray-50 data-[state=selected]:bg-blue-100/50">
                                            <TableCell>
                                                <Checkbox 
                                                    onCheckedChange={(checked) => handleCheckboxChange(tr.id, checked)}
                                                    checked={selectedRows.has(tr.id)}
                                                    aria-labelledby={`select-row-${tr.id}`}
                                                    disabled={tr.status !== 'respondido'}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium text-gray-800">{tr.game_equipes?.nome || 'Equipe desconhecida'}</TableCell>
                                            <TableCell>{renderStatusBadge(tr.status)}</TableCell>
                                            <TableCell>{renderAvaliacaoBadge(tr.avaliacao)}</TableCell>
                                            <TableCell className="max-w-xs truncate text-gray-600" title={tr.resposta || ''}>{tr.resposta || '-'}</TableCell>
                                            <TableCell className="text-sm text-gray-600">{formatarData(tr.data_resposta)}</TableCell>
                                            <TableCell className="text-right">
                                                {tr.status === 'respondido' && (
                                                    <div className="flex justify-end space-x-2">
                                                         <Button 
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEvaluate(tr.id, true)}
                                                            disabled={isUpdating}
                                                            className="text-green-600 border-green-300 hover:bg-green-50"
                                                        >
                                                            <Check className="mr-1 h-4 w-4"/> Certo
                                                        </Button>
                                                        <Button 
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEvaluate(tr.id, false)}
                                                            disabled={isUpdating}
                                                            className="text-red-600 border-red-300 hover:bg-red-50"
                                                        >
                                                            <X className="mr-1 h-4 w-4"/> Errado
                                                        </Button>
                                                    </div>
                                                )}
                                                {(tr.status === 'concluida' || tr.status === 'pendente') && (
                                                    <span className="text-xs text-gray-500 italic">N/A</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {rankingData.length > 0 && (
                <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center">
                             <Trophy className="h-5 w-5 mr-2 text-yellow-500"/> 
                             Ranking de Respostas Corretas
                         </CardTitle>
                         <CardDescription>Equipes que acertaram a resposta, ordenadas pela data de envio.</CardDescription>
                    </CardHeader>
                     <CardContent>
                         <ol className="space-y-3 list-decimal list-inside">
                             {rankingData.map((tr, index) => (
                                 <li key={tr.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                                     <span className="font-semibold text-gray-800">{tr.game_equipes?.nome || 'Equipe desconhecida'}</span>
                                     <span className="text-sm text-gray-500 ml-2"> - {formatarData(tr.data_resposta)}</span>
                                 </li>
                             ))}
                         </ol>
                    </CardContent>
                </Card>
            )}

            {isUpdating && (
                <div className="fixed bottom-4 right-4 flex items-center space-x-2 bg-gray-900 text-white p-3 rounded-lg shadow-lg z-50">
                    <RefreshCw className="animate-spin h-5 w-5" />
                    <span>Atualizando avaliações...</span>
                </div>
            )}
        </div>
    );
} 
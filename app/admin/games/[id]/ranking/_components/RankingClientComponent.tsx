'use client';

import { useRouter } from 'next/navigation';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy } from 'lucide-react';

// Tipos recebidos como props (simplificados a partir de page.tsx)
interface GameInfo {
    id: string;
    titulo: string | null; 
}

interface TeamRankingData {
  equipeId: string;
  equipeNome: string | null; // Nome pode ser nulo?
  totalPontos: number;
  questsConcluidas: number;
}

interface RankingClientComponentProps {
    game: GameInfo;
    rankingData: TeamRankingData[];
}

// Cores para o gráfico de barras (apenas um exemplo)
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function RankingClientComponent({ game, rankingData }: RankingClientComponentProps) {
    const router = useRouter();

    // Preparar dados para o gráfico (Top 5 por pontos, por exemplo)
    const chartData = rankingData
        .slice(0, 5) // Pegar top 5
        .map(team => ({
            name: team.equipeNome || 'Sem Nome',
            Pontos: team.totalPontos
        }));

    return (
        <div className="space-y-8">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-200">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Ranking do Jogo</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Jogo: <span className="font-medium text-primary-700">{game.titulo || 'Jogo sem título'}</span>
                    </p>
                </div>
                <Button 
                    onClick={() => router.push(`/admin/games/${game.id}/quests` as any)} // Volta para a lista de quests do jogo
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Quests
                </Button>
            </div>

            {/* Gráfico (se houver dados) */}
            {rankingData.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Equipes por Pontuação</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart 
                                data={chartData} 
                                margin={{ top: 5, right: 20, left: -10, bottom: 5 }} // Ajuste margens
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(206, 212, 218, 0.3)' }} 
                                    contentStyle={{ background: 'white', border: '1px solid #ccc', borderRadius: '4px', padding: '8px' }}
                                />
                                <Legend verticalAlign="top" height={36}/>
                                <Bar dataKey="Pontos" radius={[4, 4, 0, 0]}> {/* Cantos arredondados no topo */} 
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Tabela de Ranking */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Trophy className="h-5 w-5 mr-2 text-amber-500" />
                        Classificação Geral das Equipes
                    </CardTitle>
                    <CardDescription>
                        Equipes ordenadas por Pontos Totais e Quests Concluídas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-gray-100">
                                <TableRow>
                                    <TableHead className="w-[60px] text-center font-semibold text-gray-700">#</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Equipe</TableHead>
                                    <TableHead className="text-right font-semibold text-gray-700">Pontos Totais</TableHead>
                                    <TableHead className="text-right font-semibold text-gray-700">Quests Concluídas</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rankingData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                                            Nenhuma equipe encontrada ou sem pontuação neste jogo.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {rankingData.map((team, index) => (
                                    <TableRow key={team.equipeId} className="hover:bg-gray-50">
                                        <TableCell className="text-center font-medium text-gray-800">{index + 1}</TableCell>
                                        <TableCell className="font-medium text-gray-900">{team.equipeNome || 'Equipe sem nome'}</TableCell>
                                        <TableCell className="text-right font-semibold text-primary-700">{team.totalPontos}</TableCell>
                                        <TableCell className="text-right text-gray-600">{team.questsConcluidas}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 
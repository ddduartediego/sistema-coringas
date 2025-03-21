import GameDetailClient from './_components/GameDetailClient';

// Usando `any` temporariamente para resolver o problema de build
export default function GameDetailPage({ params }: any) {
  return <GameDetailClient gameId={params.id} />;
} 
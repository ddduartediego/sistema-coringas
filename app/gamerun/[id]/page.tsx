import GameDetailClient from './_components/GameDetailClient';

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GameDetailClient gameId={id} />;
} 
import EquipeDetailClient from './_components/EquipeDetailClient';

export default async function EquipeDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  return <EquipeDetailClient equipeId={id} />;
} 
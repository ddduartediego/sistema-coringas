import EquipeViewClient from './_components/EquipeViewClient';

export default async function EquipeViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EquipeViewClient equipeId={id} />;
} 
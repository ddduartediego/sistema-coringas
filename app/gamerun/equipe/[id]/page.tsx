import EquipeDetailClient from './_components/EquipeDetailClient';

export default function EquipeDetailPage({ params }: any) {
  return <EquipeDetailClient equipeId={params.id} />;
} 
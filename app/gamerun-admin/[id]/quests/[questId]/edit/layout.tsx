import Link from 'next/link';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

export default async function QuestEditLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string; questId: string }>;
}) {
  // Aguardar a resolução do params
  const { id } = await params;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          href={`/gamerun-admin/${id}/quests`}
          className="inline-flex items-center gap-1 mb-6 py-2 px-4 bg-white text-blue-600 rounded-md shadow-sm border border-blue-100 hover:bg-blue-50 transition-colors"
        >
          <ChevronLeftIcon fontSize="small" />
          <span>Voltar para Quests</span>
        </Link>
        {children}
      </main>
    </div>
  );
} 
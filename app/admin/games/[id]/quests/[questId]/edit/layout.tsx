import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from "next/link";

export default function QuestEditLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { id: string }
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <Link 
              href={`/admin/games/${params.id}/quests`}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none transition-colors"
            >
              <ArrowBackIcon />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Editor de Quest</h1>
              <p className="text-sm text-gray-500">Configure os detalhes da quest</p>
            </div>
          </div>
          <div>
            <Link
              href={`/admin/games/${params.id}` as any}
              className="text-sm text-primary-600 hover:text-primary-800 transition-colors"
            >
              Voltar para o Game
            </Link>
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
} 
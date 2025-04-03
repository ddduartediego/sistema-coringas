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
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
} 
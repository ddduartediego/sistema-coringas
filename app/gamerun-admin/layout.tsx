import AppLayout from '@/components/layout/AppLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GameRun Admin | Sistema Coringas',
  description: 'Administração de Games e Equipes do GameRun',
};

export default function GameRunAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
} 
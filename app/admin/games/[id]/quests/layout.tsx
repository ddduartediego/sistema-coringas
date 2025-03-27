import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administração de Quests | Sistema Coringas",
  description: "Gerencie as quests/provas dos seus games",
};

export default function QuestsAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 
import AppLayout from "@/components/layout/AppLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administração | Sistema Coringas",
  description: "Painel de administração do Sistema Coringas",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
} 
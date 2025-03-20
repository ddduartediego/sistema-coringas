import AppLayout from "@/components/layout/AppLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GameRun | Sistema Coringas",
  description: "Participação nos games do Sistema Coringas",
};

export default function GameRunLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
} 
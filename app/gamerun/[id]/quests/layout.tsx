import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Missões do Game",
  description: "Missões disponíveis para sua equipe",
};

export default function QuestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 
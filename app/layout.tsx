import { Geist } from "next/font/google";
import HeaderAuth from "@/components/header-auth";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import AuthManager from "@/components/auth/AuthManager";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Sistema Coringas",
  description: "Sistema para gestão de integrantes da Equipe Coringas",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={geistSans.className}>
      <body className="bg-white text-gray-900 antialiased h-screen">
        <AuthManager>
          <div className="h-full flex flex-col">
            <nav className="w-full border-b border-b-foreground/10 h-16 flex-shrink-0">
              <div className="w-full flex justify-end items-center h-full p-3 px-5">
                {!hasEnvVars ? null : <HeaderAuth />}
              </div>
            </nav>

            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </div>
        </AuthManager>
      </body>
    </html>
  );
}

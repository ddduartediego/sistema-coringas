import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
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
    <html lang="pt-BR" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col">
            <div className="flex-1 w-full flex flex-col">
              <nav className="w-full border-b border-b-foreground/10 h-16">
                <div className="w-full flex justify-end items-center h-full p-3 px-5">
                  {!hasEnvVars ? null : <HeaderAuth />}
                </div>
              </nav>
              
              <div className="flex-1">
                {children}
              </div>

              <footer className="w-full flex items-center justify-center border-t py-4 text-xs text-gray-500">
                <p>
                  &copy; {new Date().getFullYear()} Sistema Coringas
                </p>
                <span className="mx-3">•</span>
                <ThemeSwitcher />
              </footer>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

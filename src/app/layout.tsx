import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { fontesVariaveis } from "@/styles/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: "Atrium", template: "%s · Atrium" },
  description: "Painel de administração para imobiliárias.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={fontesVariaveis} suppressHydrationWarning>
      <body className="min-h-dvh bg-bg text-text">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

import { Geist, Geist_Mono } from "next/font/google";

/** Geist (UI) e Geist Mono (códigos como AT-0042). Expostas como --font-geist / --font-geist-mono e consumidas pelos tokens. */
export const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
export const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

/** Classes das duas variáveis, para o <html> do app e o preview do Storybook. */
export const fontesVariaveis = `${geist.variable} ${geistMono.variable}`;

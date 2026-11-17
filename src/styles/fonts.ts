import { Geist, Instrument_Serif } from "next/font/google";

/**
 * Instrument Serif (títulos e números de destaque, sempre peso 400), Geist (interface) e
 * Geist Mono (dinheiro em tabelas, horários, códigos como AT-0042). Expostas como variáveis CSS
 * e consumidas pelos tokens (--font-family-serif/-sans/-mono).
 */
export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});
export const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

/** Classes das duas variáveis, para o <html> do app e o preview do Storybook. */
export const fontesVariaveis = `${instrumentSerif.variable} ${geist.variable}`;

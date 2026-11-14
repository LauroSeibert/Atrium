export interface ContrastPair { fg: string; bg: string; min: number; use: string }
export interface ContrastResult extends ContrastPair {
  theme: "light" | "dark";
  fgValue: string;
  bgValue: string;
  ratio: number;
  pass: boolean;
}
export function semanticValue(tokens: unknown, theme: "light" | "dark", name: string): string;
export function evaluatePairs(tokens: unknown, contrast: { pairs: ContrastPair[] }): ContrastResult[];

/**
 * PRNG determinístico (mulberry32) e helpers de sorteio para o gerador de dados mock.
 * Mesma semente ⇒ mesma sequência, em qualquer máquina.
 */

export type Aleatorio = {
  /** Próximo número em [0, 1). */
  proximo(): number;
  /** Inteiro em [a, b], extremos inclusos. */
  inteiro(a: number, b: number): number;
  escolher<T>(lista: readonly T[]): T;
  /** Cópia embaralhada (Fisher–Yates); não altera a original. */
  embaralhar<T>(lista: readonly T[]): T[];
  /** `true` com probabilidade `p` (0…1). */
  chance(p: number): boolean;
  /** Centavos inteiros em [min, max], arredondados ao múltiplo de `passo` (padrão 1 centavo). */
  centavosEntre(min: number, max: number, passo?: number): number;
  /** Sorteio ponderado: `pesos[i]` é a chance relativa de `lista[i]`. */
  ponderado<T>(lista: readonly T[], pesos: readonly number[]): T;
};

export function mulberry32(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function criarAleatorio(semente: number): Aleatorio {
  const proximo = mulberry32(semente);
  const inteiro = (a: number, b: number) => {
    const min = Math.ceil(Math.min(a, b));
    const max = Math.floor(Math.max(a, b));
    return min + Math.floor(proximo() * (max - min + 1));
  };
  const escolher = <T>(lista: readonly T[]): T => {
    if (lista.length === 0) throw new Error("escolher: lista vazia");
    return lista[Math.floor(proximo() * lista.length)] as T;
  };
  return {
    proximo,
    inteiro,
    escolher,
    embaralhar<T>(lista: readonly T[]): T[] {
      const r = [...lista];
      for (let i = r.length - 1; i > 0; i--) {
        const j = Math.floor(proximo() * (i + 1));
        [r[i], r[j]] = [r[j] as T, r[i] as T];
      }
      return r;
    },
    chance: (p) => proximo() < p,
    centavosEntre(min, max, passo = 1) {
      const n = inteiro(Math.ceil(min / passo), Math.floor(max / passo));
      return n * passo;
    },
    ponderado<T>(lista: readonly T[], pesos: readonly number[]): T {
      const total = pesos.reduce((s, p) => s + p, 0);
      let r = proximo() * total;
      for (let i = 0; i < lista.length; i++) {
        r -= pesos[i] ?? 0;
        if (r < 0) return lista[i] as T;
      }
      return lista[lista.length - 1] as T;
    },
  };
}

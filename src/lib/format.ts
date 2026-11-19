/**
 * Formatadores pt-BR (puros, sem dependências além de Intl).
 *
 * Convenções:
 * - Valores monetários entram sempre em centavos inteiros.
 * - Espaço não separável (U+00A0) entre "R$"/número e número/unidade, para evitar quebra de linha.
 * - Datas usam locale "pt-BR" e fuso "America/Sao_Paulo"; strings ISO só com data
 *   ("2026-11-14") são tratadas como data local, sem deslocamento de fuso.
 */

const LOCALE = "pt-BR";
const TIME_ZONE = "America/Sao_Paulo";
const NBSP = " ";
const MINUS = "−";
const INVALIDO = "—";

// ---------------------------------------------------------------------------
// Instâncias Intl em cache
// ---------------------------------------------------------------------------

const moedaComCentavos = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "BRL",
});
const moedaSemCentavos = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const compactoUmaCasa = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});
const compactoInteiro = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const areaFmt = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const numeroCache = new Map<number, Intl.NumberFormat>();
const percentualCache = new Map<number, Intl.NumberFormat>();

function numeroFmt(casas: number): Intl.NumberFormat {
  let f = numeroCache.get(casas);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    });
    numeroCache.set(casas, f);
  }
  return f;
}

function percentualFmt(casas: number): Intl.NumberFormat {
  let f = percentualCache.get(casas);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE, {
      style: "percent",
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    });
    percentualCache.set(casas, f);
  }
  return f;
}

const dataCurta = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
/** "13/12/26": dentro de tabelas densas (DESIGN.md). */
const dataTabela = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});
const dataLonga = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});
const dataMesAno = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  month: "long",
  year: "numeric",
});
const dataHoraFmt = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// ---------------------------------------------------------------------------
// Moeda e números
// ---------------------------------------------------------------------------

/**
 * Formata um valor em centavos inteiros como Real brasileiro.
 *
 * - `123456` → "R$ 1.234,56"
 * - `semCentavos` → "R$ 1.235" (arredonda para o real mais próximo)
 * - `compacto` (para KPIs): a partir de R$ 1.000 usa "mil"/"mi"
 *   ("R$ 850 mil", "R$ 1,2 mi"); abaixo disso mantém o formato normal
 *   (999,99 reais → "R$ 999,99"). Valores negativos recebem "-" antes de "R$".
 *
 * @param centavos Valor em centavos (inteiro).
 * @param opts Opções de formatação.
 */
export function formatMoeda(centavos: number, opts: { compacto?: boolean; semCentavos?: boolean } = {}): string {
  const { compacto = false, semCentavos = false } = opts;

  if (compacto) {
    const reais = Math.abs(centavos) / 100;
    if (reais >= 1000) {
      const sinal = centavos < 0 ? "-" : "";
      let milhares = reais / 1000;
      // Casas decimais: 1 casa abaixo de 10 mil, inteiro de 10 mil a 999 mil.
      let texto = milhares < 10 ? compactoUmaCasa.format(milhares) : compactoInteiro.format(milhares);
      milhares = Number(milhares < 10 ? milhares.toFixed(1) : milhares.toFixed(0));
      if (milhares < 1000) {
        return `${sinal}R$${NBSP}${texto}${NBSP}mil`;
      }
      // Arredondou para 1000 mil: promove para milhões.
      texto = compactoUmaCasa.format(reais / 1_000_000);
      return `${sinal}R$${NBSP}${texto}${NBSP}mi`;
    }
  }

  const fmt = semCentavos ? moedaSemCentavos : moedaComCentavos;
  return fmt.format(centavos / 100);
}

/**
 * Formata uma área em metros quadrados, com no máximo 1 casa decimal.
 * Ex.: `120` → "120 m²", `85.5` → "85,5 m²" (com espaço não separável).
 *
 * @param m2 Área em m².
 */
export function formatArea(m2: number): string {
  return `${areaFmt.format(m2)}${NBSP}m²`;
}

/**
 * Formata um número com separador de milhar pt-BR.
 * Ex.: `1234` → "1.234"; `1234.5, 2` → "1.234,50".
 *
 * @param n Número a formatar.
 * @param casas Casas decimais fixas (padrão 0).
 */
export function formatNumero(n: number, casas = 0): string {
  return numeroFmt(casas).format(n);
}

/**
 * Formata uma fração como percentual. Ex.: `0.125` → "12,5%".
 *
 * @param fracao Valor em fração (0.125 = 12,5%).
 * @param casas Casas decimais (padrão 1).
 */
export function formatPercentual(fracao: number, casas = 1): string {
  return percentualFmt(casas).format(fracao);
}

/**
 * Formata uma variação percentual com sinal explícito (1 casa decimal).
 * Positivo → "+12,5%"; negativo → "−3,0%" (sinal de menos real, U+2212);
 * zero (ou que arredonda para zero) → "0,0%".
 *
 * @param fracao Variação em fração (0.125 = +12,5%).
 */
export function formatVariacao(fracao: number): string {
  const texto = percentualFmt(1).format(Math.abs(fracao));
  if (Math.round(Math.abs(fracao) * 1000) === 0) return texto;
  return `${fracao > 0 ? "+" : MINUS}${texto}`;
}

// ---------------------------------------------------------------------------
// Datas
// ---------------------------------------------------------------------------

/**
 * Converte entrada em Date. Strings ISO só com data ("2026-11-14") viram o
 * meio-dia de São Paulo daquele dia, evitando deslocamento de fuso.
 * Retorna null se inválida.
 */
function paraDate(data: Date | string): Date | null {
  let d: Date;
  if (typeof data === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
    if (m) {
      const [a, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
      // 15:00 UTC = 12:00 em São Paulo (UTC-3): mesmo dia em qualquer máquina.
      d = new Date(Date.UTC(a, mes - 1, dia, 15));
      // Rejeita datas inexistentes (ex.: 2026-02-30), que o Date "rola" adiante.
      if (d.getUTCFullYear() !== a || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) {
        return null;
      }
    } else {
      d = new Date(data);
    }
  } else {
    d = data;
  }
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Formata uma data em pt-BR (fuso America/Sao_Paulo).
 *
 * Estilos:
 * - `curta` (padrão): "14/11/2026"
 * - `longa`: "14 de novembro de 2026"
 * - `mesAno`: "novembro de 2026" (mês por extenso, não abreviado)
 *
 * Strings só com data ("2026-11-14") são tratadas como data local.
 * Entrada inválida retorna "—".
 *
 * @param data Date ou string ISO.
 * @param estilo Estilo de saída.
 */
export function formatData(data: Date | string, estilo: "curta" | "tabela" | "longa" | "mesAno" = "curta"): string {
  const d = paraDate(data);
  if (!d) return INVALIDO;
  switch (estilo) {
    case "tabela":
      return dataTabela.format(d);
    case "longa":
      return dataLonga.format(d);
    case "mesAno":
      return dataMesAno.format(d);
    default:
      return dataCurta.format(d);
  }
}

/**
 * Formata data e hora em pt-BR (fuso America/Sao_Paulo, 24 h).
 * Ex.: "14/11/2026, 09:30". Entrada inválida retorna "—".
 *
 * @param data Date ou string ISO.
 */
export function formatDataHora(data: Date | string): string {
  const d = paraDate(data);
  return d ? dataHoraFmt.format(d) : INVALIDO;
}

/** Número de dias (calendário de São Paulo) desde a época, para comparar dias. */
function diaCalendario(d: Date): number {
  const [dia, mes, ano] = dataCurta.format(d).split("/").map(Number);
  return Date.UTC(ano ?? 0, (mes ?? 1) - 1, dia ?? 1) / 86_400_000;
}

/**
 * Formata uma data de forma relativa a `agora`.
 *
 * - strings só com data ("2026-11-14") comparam por dia de calendário
 *   (São Paulo): "hoje", "ontem", "amanhã", "há N dias"...
 * - menos de 60 s (passado ou futuro) → "agora"
 * - menos de 1 h → "há 5 min" / "em 5 min"
 * - menos de 24 h → "há 2 h" / "em 2 h"
 * - dias de calendário: -1 → "ontem", +1 → "amanhã", "há 3 dias", "em 2 dias"
 * - além de 30 dias → `formatData` (curta)
 *
 * @param data Data alvo.
 * @param agora Referência de "agora" (padrão: `new Date()`).
 */
export function formatRelativo(data: Date | string, agora: Date = new Date()): string {
  const d = paraDate(data);
  if (!d) return INVALIDO;

  const soData = typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data);
  const diffSeg = Math.trunc((d.getTime() - agora.getTime()) / 1000);
  const abs = Math.abs(diffSeg);
  const futuro = diffSeg > 0;
  const fmt = (n: number, un: string) => (futuro ? `em ${n} ${un}` : `há ${n} ${un}`);

  if (!soData) {
    if (abs < 60) return "agora";
    if (abs < 3600) return fmt(Math.floor(abs / 60), "min");
    if (abs < 86_400) return fmt(Math.floor(abs / 3600), "h");
  }

  const dias = diaCalendario(d) - diaCalendario(agora);
  if (dias === 0) return "hoje";
  if (dias === -1) return "ontem";
  if (dias === 1) return "amanhã";
  if (Math.abs(dias) > 30) return formatData(d);
  return dias < 0 ? `há ${-dias} dias` : `em ${dias} dias`;
}

// ---------------------------------------------------------------------------
// Telefone e documentos
// ---------------------------------------------------------------------------

/**
 * Formata telefone brasileiro. Remove não-dígitos e aplica:
 * - 11 dígitos → "(11) 91234-5678"
 * - 10 dígitos → "(11) 3123-4567"
 * - 13/12 dígitos iniciando em 55 → "+55 (11) 91234-5678" / "+55 (11) 3123-4567"
 * - 11 dígitos iniciando em 0800/0300/0500/0900 → "0800 123 4567"
 * Qualquer outro formato (inclusive iniciado em 0) devolve a entrada original.
 *
 * @param digitos Telefone (com ou sem máscara).
 */
export function formatTelefone(digitos: string): string {
  const d = digitos.replace(/\D/g, "");
  if (/^0[3589]00\d{7}$/.test(d)) {
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  }
  const local = (s: string): string | null => {
    if (s.startsWith("0")) return null;
    if (s.length === 11) {
      return `(${s.slice(0, 2)}) ${s.slice(2, 7)}-${s.slice(7)}`;
    }
    if (s.length === 10) {
      return `(${s.slice(0, 2)}) ${s.slice(2, 6)}-${s.slice(6)}`;
    }
    return null;
  };

  if ((d.length === 13 || d.length === 12) && d.startsWith("55")) {
    const r = local(d.slice(2));
    return r ? `+55 ${r}` : digitos;
  }
  return local(d) ?? digitos;
}

/**
 * Mascara CPF ou CNPJ para exibição (LGPD), mostrando só o miolo.
 * - CPF (11 dígitos) → "***.456.789-**"
 * - CNPJ (14 dígitos) → "**.345.678/0001-**"
 * Qualquer outro formato devolve a entrada inalterada.
 *
 * @param doc CPF ou CNPJ (com ou sem pontuação).
 */
export function formatDocumentoMascarado(doc: string): string {
  const d = doc.replace(/\D/g, "");
  if (d.length === 11) {
    return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
  }
  if (d.length === 14) {
    return `**.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-**`;
  }
  return doc;
}

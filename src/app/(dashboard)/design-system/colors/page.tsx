import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import tokens from "@design-system/tokens.json";
import contrast from "@design-system/contrast.json";
import adjustmentsData from "@design-system/adjustments.json";
import { resolveAlias } from "@design-system/tokens-lib.mjs";
import { evaluatePairs, semanticValue, type ContrastResult } from "@design-system/contrast-lib.mjs";
import { AtriumLogo, AtriumMark } from "@/components/brand/AtriumLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const metadata: Metadata = { title: "Cores · Design system" };

type Theme = "light" | "dark";
type TokenNode = { $value: unknown; $description?: string };

const isToken = ([key]: [string, unknown]) => !key.startsWith("$");
const scaleNames = ["green", "beige", "neutral"] as const;
const scaleLabel: Record<(typeof scaleNames)[number], string> = {
  green: "Hunter Green",
  beige: "Soft Beige",
  neutral: "Neutro (matiz verde)",
};

const semanticEntries = Object.entries(tokens.semantic.light).filter(isToken) as [string, TokenNode][];
const results = evaluatePairs(tokens, contrast);
const passed = results.filter((r) => r.pass).length;
const fmtRatio = (n: number) => `${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}:1`;
const swatch = (cssVar: string): CSSProperties => ({ backgroundColor: `var(--${cssVar})` });

const brandColors = [
  { token: "brand-snow", name: "Polar Snow", value: tokens.color.brand.snow.$value, share: 60, role: "Fundo principal, texto sobre verde" },
  { token: "brand-beige", name: "Soft Beige", value: tokens.color.brand.beige.$value, share: 30, role: "Superfícies secundárias, destaques quentes" },
  { token: "brand-green", name: "Hunter Green", value: tokens.color.brand.green.$value, share: 10, role: "Primária: ações, navegação, texto forte" },
];

const adjustments = adjustmentsData.items.map((a) => ({
  ...a,
  to: a.to.startsWith("{") ? String(resolveAlias(tokens, a.to)) : a.to,
}));

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {description ? <p className="max-w-prose text-text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ContrastPanel({ theme }: { theme: Theme }) {
  const rows = results.filter((r) => r.theme === theme);
  const ok = rows.filter((r) => r.pass).length;
  return (
    <div className={`${theme} overflow-hidden rounded-lg border border-border bg-surface text-text shadow-1`}>
      <div className="flex items-center justify-between gap-4 border-b border-border bg-bg-subtle px-4 py-3">
        <h3 className="font-semibold">{theme === "light" ? "Tema claro" : "Tema escuro"}</h3>
        <span className="tnum text-sm text-text-muted">
          {ok}/{rows.length} aprovadas
        </span>
      </div>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">
          Contraste das combinações de texto e fundo no {theme === "light" ? "tema claro" : "tema escuro"}
        </caption>
        <thead className="text-xs text-text-muted">
          <tr>
            <th scope="col" className="px-4 py-2 font-medium">Amostra</th>
            <th scope="col" className="px-4 py-2 font-medium">Combinação</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Razão</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: ContrastResult) => (
            <tr key={`${r.fg}-${r.bg}`} className="border-t border-border">
              <td className="px-4 py-2">
                <span
                  className="inline-flex h-8 min-w-16 items-center justify-center rounded-sm border border-border px-2 font-semibold"
                  style={{ ...swatch(r.bg), color: `var(--${r.fg})` }}
                  aria-hidden="true"
                >
                  {r.min >= 4.5 ? "Aa" : "▮ ◯"}
                </span>
              </td>
              <td className="px-4 py-2">
                <div className="font-medium">
                  <code>{r.fg}</code> <span className="text-text-muted">sobre</span> <code>{r.bg}</code>
                </div>
                <div className="text-xs text-text-muted">{r.use}</div>
              </td>
              <td className="tnum px-4 py-2 text-right">
                <div className="font-semibold">{fmtRatio(r.ratio)}</div>
                <div className="text-xs text-text-muted">mín. {fmtRatio(r.min)}</div>
              </td>
              <td className="px-4 py-2 text-right">
                <span
                  className={[
                    "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                    r.pass ? "bg-success-bg text-success" : "bg-danger-bg text-danger",
                  ].join(" ")}
                >
                  {r.pass ? "Aprovado" : "Reprovado"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ColorsPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 sm:px-8 sm:py-12">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-4">
          <AtriumLogo className="h-8 w-auto" />
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-widest text-text-muted uppercase">Design system</p>
            <h1 className="text-3xl font-semibold tracking-tight">Cores</h1>
            <p className="max-w-prose text-base text-text-muted">
              Paleta da marca, escalas derivadas em OKLCH e tokens semânticos. O código usa apenas os tokens
              semânticos; todas as combinações abaixo são verificadas pelo script <code>npm run check:contrast</code>.
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <Section id="marca" title="Marca" description="Três cores, na proporção 60-30-10.">
        <div className="flex h-12 overflow-hidden rounded-lg border border-border-strong" role="img" aria-label="Proporção: Polar Snow 60%, Soft Beige 30%, Hunter Green 10%">
          {brandColors.map((c) => (
            <div key={c.token} style={{ ...swatch(c.token), flexGrow: c.share }} />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {brandColors.map((c) => (
            <div key={c.token} className="overflow-hidden rounded-lg border border-border bg-surface shadow-1">
              <div className="h-24 border-b border-border" style={swatch(c.token)} />
              <div className="flex flex-col gap-1 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{c.name}</span>
                  <span className="tnum text-sm text-text-muted">{c.share}%</span>
                </div>
                <code className="text-sm">{c.value}</code>
                <p className="text-xs text-text-muted">{c.role}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-text-muted">
          Ocre <code>{tokens.color.brand.ochre.$value}</code>{" "}
          <span className="inline-block size-3 rounded-full align-middle" style={swatch("brand-ochre")} aria-hidden="true" /> é
          exclusivo de gráficos e preenchimentos: nunca texto sobre fundo claro (2,97:1).
        </p>
      </Section>

      <Section id="logo" title="Logo" description="O átrio da domus romana visto de cima: o telhado de quatro águas caindo para o impluvium, o espelho d'água central.">
        <div className="grid gap-4 sm:grid-cols-2">
          {(["light", "dark"] as const).map((t) => (
            <div key={t} className={`${t} flex items-center gap-6 rounded-lg border border-border bg-bg p-6`}>
              <AtriumMark className="size-12 shrink-0" />
              <AtriumLogo className="h-8 w-auto" />
              <span className="ml-auto text-xs text-text-muted">{t === "light" ? "Claro" : "Escuro"}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="escalas" title="Escalas" description="Interpoladas em OKLCH preservando o matiz. Âncoras: green-900, beige-200 e neutral-50 são as cores exatas da marca.">
        <div className="flex flex-col gap-6">
          {scaleNames.map((name) => {
            const scale = Object.entries(tokens.color.scale[name]).filter(isToken) as [string, TokenNode][];
            return (
              <div key={name} className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">{scaleLabel[name]}</h3>
                <ol className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-11">
                  {scale.map(([step, node]) => {
                    const anchor =
                      (name === "green" && step === "900") || (name === "beige" && step === "200") || (name === "neutral" && step === "50");
                    return (
                      <li key={step} className="flex flex-col gap-1">
                        <div
                          className={`h-12 rounded-md border ${anchor ? "border-ring border-2" : "border-border"}`}
                          style={swatch(`${name}-${step}`)}
                        />
                        <span className="text-xs font-medium">
                          {step}
                          {anchor ? <span className="text-text-muted"> · âncora</span> : null}
                        </span>
                        <code className="text-xs text-text-muted">{String(node.$value)}</code>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>
      </Section>

      <Section id="semanticos" title="Tokens semânticos" description="Os únicos valores que componentes e telas podem usar. A amostra segue o tema ativo.">
        <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-1">
          <table className="w-full min-w-xl text-left text-sm">
            <caption className="sr-only">Tokens semânticos com valores nos temas claro e escuro</caption>
            <thead className="bg-bg-subtle text-xs text-text-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">Token</th>
                <th scope="col" className="px-4 py-2 font-medium">Claro</th>
                <th scope="col" className="px-4 py-2 font-medium">Escuro</th>
                <th scope="col" className="px-4 py-2 font-medium">Uso</th>
              </tr>
            </thead>
            <tbody>
              {semanticEntries.map(([name, node]) => (
                <tr key={name} className="border-t border-border">
                  <th scope="row" className="px-4 py-2 font-medium">
                    <span className="flex items-center gap-2">
                      <span className="size-6 shrink-0 rounded-sm border border-border-strong" style={swatch(name)} aria-hidden="true" />
                      <code>--{name}</code>
                    </span>
                  </th>
                  {(["light", "dark"] as const).map((t) => (
                    <td key={t} className="px-4 py-2">
                      <span className="flex items-center gap-2">
                        <span className={`${t} size-4 shrink-0 rounded-full border border-border-strong`} style={swatch(name)} aria-hidden="true" />
                        <code className="text-xs">{semanticValue(tokens, t, name)}</code>
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-2 text-text-muted">{node.$description ?? "Estado de feedback"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        id="contraste"
        title="Contraste"
        description={`${passed} de ${results.length} combinações aprovadas. Mínimos WCAG 2.2: 4,5:1 para texto, 3:1 para bordas de controles e foco.`}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <ContrastPanel theme="light" />
          <ContrastPanel theme="dark" />
        </div>
      </Section>

      <Section id="ajustes" title="Ajustes técnicos" description="Correções feitas sobre os valores do guia para cumprir o Gate 1.">
        <ul className="grid gap-3 sm:grid-cols-2">
          {adjustments.map((a) => (
            <li key={a.token} className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 shadow-1">
              <code className="font-semibold">{a.token}</code>
              <span className="tnum text-sm">
                <span className="text-text-muted line-through">{a.from}</span> → {String(a.to)}
              </span>
              <span className="text-sm text-text-muted">{a.why}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

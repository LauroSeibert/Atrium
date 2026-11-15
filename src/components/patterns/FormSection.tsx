"use client";

/**
 * Blocos de formulário multi-seção (RF-27, RF-35): seção em card, índice de seções, resumo de
 * erros (WCAG 3.3.1), rodapé de envio, campos numéricos/moeda e mensagens de validação em pt-BR.
 * Apresentação apenas: as regras de validação vêm do schema do domínio (zod).
 */
import { useId, useState, type ReactNode } from "react";
import { Check, ChevronDown, CircleAlert, Plus } from "lucide-react";
import type { z } from "zod";
import { cn } from "@/lib/cn";
import { formatNumero } from "@/lib/format";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";
import { Input } from "../ui/Input";
import { Skeleton } from "../ui/Skeleton";
import { Tag } from "../ui/Badge";
import { Heading, Text } from "../ui/Typography";

/* ---------- Estado de envio (união discriminada, recebida por prop) ---------- */

export type EnvioFormulario =
  { fase: "idle" } | { fase: "salvando" } | { fase: "erro"; mensagem: string } | { fase: "salvo" };

/* ---------- Seção e índice ---------- */

export type FormSectionProps = {
  id: string;
  titulo: string;
  descricao?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Seção do formulário: card com título, descrição e grade de campos (1 col em 360 px, 2 a partir de 768 px). */
export function FormSection({ id, titulo, descricao, children, className }: FormSectionProps) {
  const tituloId = `${id}-titulo`;
  return (
    <Card asChild className={cn("scroll-mt-4", className)}>
      <section id={id} aria-labelledby={tituloId}>
        <div className="flex flex-col gap-1 p-4 pb-0 md:p-6 md:pb-0">
          <Heading level={2} size="lg" id={tituloId}>
            {titulo}
          </Heading>
          {descricao ? (
            <Text tone="muted" size="sm">
              {descricao}
            </Text>
          ) : null}
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 md:p-6">{children}</div>
      </section>
    </Card>
  );
}

/** Ocupa as duas colunas da grade da seção. */
export const LARGURA_TOTAL = "md:col-span-2";

export type FormSectionIndexProps = {
  secoes: { id: string; titulo: string }[];
  className?: string;
};

/** Índice de âncoras para formulários longos. */
export function FormSectionIndex({ secoes, className }: FormSectionIndexProps) {
  return (
    <nav aria-label="Seções do formulário" className={className}>
      <ol className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
        {secoes.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="inline-flex min-h-10 items-center rounded-md px-3 text-sm text-text-muted transition duration-(--dur-fast) ease-standard hover:bg-bg-subtle hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring max-md:min-h-11 max-md:border max-md:border-border-strong max-md:text-text lg:w-full"
            >
              {s.titulo}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ---------- Mensagens de validação em pt-BR ---------- */

const POR_CAMPO: Record<string, string> = {
  corretorId: "Selecione o corretor",
  responsavelId: "Selecione o responsável",
};

type Issue = z.core.$ZodRawIssue;

/**
 * Mapa de mensagens (zod v4 `error` de parse) para os erros padrão em inglês. Só atua quando o
 * schema não trouxe mensagem própria; as mensagens em pt-BR do domínio têm precedência.
 */
export function mensagemZodPtBr(iss: Issue): string | undefined {
  const campo = String(iss.path?.[iss.path.length - 1] ?? "");
  const input = (iss as { input?: unknown }).input;
  switch (iss.code) {
    case "invalid_type": {
      if (POR_CAMPO[campo]) return POR_CAMPO[campo];
      if (input === undefined || input === null || input === "") return "Preencha este campo";
      if (iss.expected === "int") return "Informe um número inteiro";
      if (iss.expected === "number") return "Informe um número válido";
      return "Valor inválido";
    }
    case "invalid_value":
      return "Selecione uma opção";
    case "too_small": {
      const min = Number(iss.minimum);
      if (iss.origin === "string") return min <= 1 ? "Preencha este campo" : `Use pelo menos ${min} caracteres`;
      if (iss.origin === "array") return `Informe ao menos ${min} ${min === 1 ? "item" : "itens"}`;
      if (iss.inclusive === false && min === 0) return "Informe um valor maior que zero";
      return `Informe um valor de pelo menos ${min}`;
    }
    case "too_big": {
      const max = Number(iss.maximum);
      if (iss.origin === "string") return `Use no máximo ${max} caracteres`;
      return `O valor máximo é ${max}`;
    }
    case "invalid_format": {
      if (iss.format === "email") return "Informe um e-mail válido";
      if (campo === "telefone") return "Telefone com DDD, 10 ou 11 dígitos";
      return "Formato inválido";
    }
    case "custom":
      return undefined;
    default:
      return "Valor inválido";
  }
}

/* ---------- Erros: achatar, resumo e foco ---------- */

export type ErroDeCampo = { caminho: string; mensagem: string };

/** Achata o objeto de erros do react-hook-form em `{ caminho, mensagem }`. */
export function achatarErros(erros: unknown, prefixo = ""): ErroDeCampo[] {
  if (!erros || typeof erros !== "object") return [];
  const obj = erros as Record<string, unknown>;
  const saida: ErroDeCampo[] = [];
  if (typeof obj.message === "string" && obj.message) {
    saida.push({ caminho: prefixo.replace(/\.root$/, ""), mensagem: obj.message });
  }
  for (const [chave, valor] of Object.entries(obj)) {
    if (chave === "ref" || chave === "message" || chave === "type" || chave === "types") continue;
    if (valor && typeof valor === "object") {
      saida.push(...achatarErros(valor, prefixo ? `${prefixo}.${chave}` : chave));
    }
  }
  return saida;
}

export function idDoCampo(base: string, caminho: string) {
  return `${base}-${caminho.replace(/\./g, "-")}`;
}

/** Foca o primeiro (na ordem do documento) dos elementos com estes ids. */
export function focarPrimeiro(ids: string[]) {
  const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
  els.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  els[0]?.focus();
}

export function irParaCampo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ block: "center" });
  el.focus();
}

export type ResumoErrosProps = {
  erros: { id: string; rotulo: string; mensagem: string }[];
};

/** Resumo no topo com links para os campos inválidos (WCAG 3.3.1). */
export function ResumoErros({ erros }: ResumoErrosProps) {
  const tituloId = useId();
  if (erros.length === 0) return null;
  return (
    <section
      aria-labelledby={tituloId}
      className="flex flex-col gap-2 rounded-lg border border-danger bg-danger-bg p-4 text-danger"
    >
      <h2 id={tituloId} className="flex items-center gap-2 text-base font-semibold">
        <Icon icon={CircleAlert} size={20} />
        {erros.length === 1 ? "Corrija 1 campo para salvar" : `Corrija ${erros.length} campos para salvar`}
      </h2>
      <ul className="flex list-disc flex-col gap-1 pl-6 text-sm">
        {erros.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              onClick={(ev) => {
                ev.preventDefault();
                irParaCampo(e.id);
              }}
              className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {e.rotulo}
            </a>
            : {e.mensagem}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Erro devolvido pelo servidor ao salvar, no topo do formulário. */
export function AlertaServidor({ envio }: { envio: EnvioFormulario }) {
  if (envio.fase !== "erro") return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-danger bg-danger-bg p-4 text-sm text-danger"
    >
      <Icon icon={CircleAlert} size={20} />
      <span>{envio.mensagem}</span>
    </div>
  );
}

/** Rodapé de envio: ação principal à direita (Fitts), fixo ao fim da tela, com anúncio em `role="status"`. */
export function RodapeEnvio({
  envio,
  onCancelar,
  rotuloSalvar = "Salvar",
}: {
  envio: EnvioFormulario;
  onCancelar?: () => void;
  rotuloSalvar?: string;
}) {
  const salvando = envio.fase === "salvando";
  return (
    <div className="sticky bottom-0 z-(--z-sticky) -mx-4 border-t border-border bg-surface px-4 py-3 md:mx-0 md:rounded-lg md:border">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <p role="status" className="mr-auto flex items-center gap-1 text-sm text-text-muted">
          {envio.fase === "salvo" ? (
            <>
              <Icon icon={Check} size={16} className="text-success" />
              <span className="text-success">Salvo</span>
            </>
          ) : null}
          {salvando ? "Salvando…" : null}
        </p>
        {onCancelar ? (
          <Button variant="secondary" onClick={onCancelar} disabled={salvando} className="max-md:h-11">
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" loading={salvando} className="max-md:h-11">
          {rotuloSalvar}
        </Button>
      </div>
    </div>
  );
}

/** Esqueleto de uma seção: título, descrição e `campos` rótulos + entradas na grade final. */
export function FormSectionSkeleton({ campos = 4, className }: { campos?: number; className?: string }) {
  return (
    <Card className={cn(className)}>
      <div className="flex flex-col gap-2 p-4 pb-0 md:p-6 md:pb-0">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 md:p-6">
        {Array.from({ length: campos }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton shape="rect" className="h-10" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Esqueleto do rodapé de envio. */
export function RodapeEnvioSkeleton() {
  return (
    <div className="flex items-center justify-end gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <Skeleton shape="rect" className="h-10 w-24" />
      <Skeleton shape="rect" className="h-10 w-32" />
    </div>
  );
}

/* ---------- Campos numéricos e de moeda ---------- */

type Vazio = null | undefined;

function numeroParaTexto(v: number | Vazio): string {
  return v === null || v === undefined || Number.isNaN(v) ? "" : String(v).replace(".", ",");
}

function textoParaNumero(texto: string, vazio: Vazio): number | Vazio {
  const t = texto.trim();
  if (t === "") return vazio;
  // pt-BR: ponto separa milhar ("1.000"), vírgula separa decimal ("1,5").
  if (!/\d/.test(t) || !/^(\d{1,3}(\.\d{3})+|\d*)(,\d*)?$/.test(t)) return Number.NaN;
  return Number(t.replace(/\./g, "").replace(",", "."));
}

type CampoBase = {
  value: number | Vazio;
  onChange: (valor: number | Vazio) => void;
  onBlur?: () => void;
  /** Valor emitido quando o campo fica vazio. Padrão `null` (o react-hook-form troca `undefined` pelo valor padrão). */
  vazio?: Vazio;
  suffix?: ReactNode;
  disabled?: boolean;
  placeholder?: string;
};

/** Hook de texto digitado que acompanha o valor externo (reset do formulário) sem perder o que se digita. */
function useTextoSincronizado<T>(value: T, formatar: (v: T) => string, parse: (t: string) => T) {
  const [estado, setEstado] = useState({ texto: formatar(value), visto: value });
  if (!Object.is(estado.visto, value)) {
    const mantem = Object.is(parse(estado.texto), value);
    setEstado({ texto: mantem ? estado.texto : formatar(value), visto: value });
  }
  return [estado.texto, setEstado] as const;
}

/** Número (inteiro ou decimal com vírgula). Emite `NaN` para texto inválido, para o schema recusar. */
export function CampoNumero({ value, onChange, onBlur, vazio = null, suffix, disabled, placeholder }: CampoBase) {
  const parse = (t: string) => textoParaNumero(t, vazio);
  const [texto, setEstado] = useTextoSincronizado<number | Vazio>(value, numeroParaTexto, parse);
  return (
    <Input
      inputMode="decimal"
      autoComplete="off"
      value={texto}
      suffix={suffix}
      disabled={disabled}
      placeholder={placeholder}
      className="tnum"
      onBlur={onBlur}
      onChange={(e) => {
        const novo = parse(e.target.value);
        setEstado({ texto: e.target.value, visto: novo });
        onChange(novo);
      }}
    />
  );
}

function centavosParaTexto(c: number | Vazio): string {
  return c === null || c === undefined || Number.isNaN(c) ? "" : formatNumero(c / 100, 2);
}

function textoParaCentavos(texto: string, vazio: Vazio): number | Vazio {
  let t = texto.replace(/R\$/gi, "").replace(/\s/g, "");
  if (t === "") return vazio;
  if (!t.includes(",") && /\.\d{1,2}$/.test(t)) t = t.replace(/\.(\d{1,2})$/, ",$1");
  t = t.replace(/\./g, "");
  if (!/^\d+(,\d{0,2})?$/.test(t)) return Number.NaN;
  return Math.round(Number(t.replace(",", ".")) * 100);
}

/** Moeda: o usuário digita em reais ("1.250,50") e o formulário guarda centavos inteiros. */
export function CampoMoeda({ value, onChange, onBlur, vazio = null, disabled, placeholder }: CampoBase) {
  const parse = (t: string) => textoParaCentavos(t, vazio);
  const [texto, setEstado] = useTextoSincronizado<number | Vazio>(value, centavosParaTexto, parse);
  return (
    <Input
      inputMode="decimal"
      autoComplete="off"
      value={texto}
      prefix="R$"
      disabled={disabled}
      placeholder={placeholder}
      className="tnum"
      onBlur={() => {
        const c = parse(texto);
        if (typeof c === "number" && !Number.isNaN(c)) setEstado({ texto: centavosParaTexto(c), visto: c });
        onBlur?.();
      }}
      onChange={(e) => {
        const novo = parse(e.target.value);
        setEstado({ texto: e.target.value, visto: novo });
        onChange(novo);
      }}
    />
  );
}

/** Campo com máscara: guarda só os dígitos (`mascarar` formata a exibição). */
export function CampoMascara({
  digitos,
  onChange,
  onBlur,
  mascarar,
  maxDigitos,
  inputMode = "numeric",
  type,
  placeholder,
  autoComplete,
}: {
  digitos: string;
  onChange: (digitos: string) => void;
  onBlur?: () => void;
  mascarar: (digitos: string) => string;
  maxDigitos: number;
  inputMode?: "numeric" | "tel";
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <Input
      type={type}
      inputMode={inputMode}
      autoComplete={autoComplete}
      placeholder={placeholder}
      className="tnum"
      value={mascarar(digitos)}
      onBlur={onBlur}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, maxDigitos))}
    />
  );
}

/* ---------- Chips (diferenciais, bairros) ---------- */

/** Lista de textos como chips; Enter ou o botão adiciona, repetidos são ignorados. */
export function CampoChips({
  value,
  onChange,
  rotuloAdicionar,
  placeholder,
}: {
  value: string[];
  onChange: (valor: string[]) => void;
  rotuloAdicionar: string;
  placeholder?: string;
}) {
  const [texto, setTexto] = useState("");
  const adicionar = () => {
    const t = texto.trim();
    if (t && !value.some((v) => v.toLowerCase() === t.toLowerCase())) onChange([...value, t]);
    setTexto("");
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={texto}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              adicionar();
            }
          }}
          wrapperClassName="flex-1"
        />
        <Button variant="secondary" leadingIcon={Plus} onClick={adicionar} aria-label={rotuloAdicionar}>
          <span className="max-sm:sr-only">Adicionar</span>
        </Button>
      </div>
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Itens adicionados">
          {value.map((v) => (
            <li key={v} className="max-w-full">
              <Tag
                removeLabel={`Remover ${v}`}
                onRemove={() => onChange(value.filter((x) => x !== v))}
                className="max-w-full"
              >
                <span className="truncate">{v}</span>
              </Tag>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ---------- Disclosure ---------- */

/** Seção recolhível (ex.: "Mais detalhes"). O conteúdo continua montado para manter os valores. */
export function Recolhivel({
  titulo,
  aberto,
  onAbertoChange,
  children,
}: {
  titulo: string;
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-4 md:col-span-2">
      <Button
        variant="ghost"
        className="w-fit max-md:h-11"
        aria-expanded={aberto}
        aria-controls={id}
        trailingIcon={ChevronDown}
        onClick={() => onAbertoChange(!aberto)}
      >
        {titulo}
      </Button>
      <div id={id} hidden={!aberto} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

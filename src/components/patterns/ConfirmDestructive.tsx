"use client";

import { AlertDialog as AlertPrimitive } from "radix-ui";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Select, type SelectOption } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

/** Fase da confirmação, controlada por quem chama (ESTADOS §2 regra 6). */
export type FaseConfirmacao = { fase: "idle" } | { fase: "confirmando" } | { fase: "erro"; mensagem: string };

export type CampoMotivo = {
  rotulo: string;
  obrigatorio: boolean;
  /** Mensagem de validação inline (padrão: "Informe o motivo."). */
  mensagemObrigatorio?: string;
} & (
  | { tipo: "select"; opcoes: SelectOption[]; placeholder?: string }
  | { tipo: "texto"; maxLength?: number; ajuda?: string }
);

export type ConfirmDestructiveProps = {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  /** Inclui o nome do item: "Cancelar o contrato CT-2026-0012?". */
  titulo: string;
  /** Frase de contexto opcional acima da lista de impactos. */
  descricao?: string;
  /** Números do item que ajudam a decidir (ex.: publicado em, visualizações, contatos), em faixa acima dos impactos. */
  resumo?: { rotulo: string; valor: ReactNode }[];
  /** O que acontece ao confirmar, um item por consequência. */
  impactos: string[];
  motivo?: CampoMotivo;
  rotuloConfirmar: string;
  rotuloVoltar?: string;
  fase?: FaseConfirmacao;
  /** Recebe o motivo (já validado e sem espaços nas pontas) quando há campo de motivo. */
  onConfirmar: (motivo?: string) => void;
};

function Corpo({
  descricao,
  resumo,
  impactos,
  motivo,
  rotuloConfirmar,
  rotuloVoltar,
  fase,
  onConfirmar,
}: Omit<ConfirmDestructiveProps, "aberto" | "onAbertoChange" | "titulo"> & { fase: FaseConfirmacao }) {
  const [valor, setValor] = useState("");
  const [tentou, setTentou] = useState(false);
  const confirmando = fase.fase === "confirmando";
  const vazio = valor.trim() === "";
  const erroMotivo =
    motivo?.obrigatorio && vazio && tentou ? (motivo.mensagemObrigatorio ?? "Informe o motivo.") : undefined;

  const confirmar = (event: { preventDefault: () => void }) => {
    event.preventDefault(); // não fecha sozinho: quem chama controla `aberto` ao concluir.
    if (confirmando) return;
    if (motivo?.obrigatorio && vazio) {
      setTentou(true);
      return;
    }
    onConfirmar(motivo ? valor.trim() || undefined : undefined);
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {descricao ? (
          <AlertPrimitive.Description className="text-sm text-text-muted">{descricao}</AlertPrimitive.Description>
        ) : null}
        {resumo && resumo.length > 0 ? (
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border">
            {resumo.map((r) => (
              <div key={r.rotulo} className="flex min-w-0 flex-col gap-1 bg-surface px-3 py-2.5">
                <dt className="text-caption text-text-muted">{r.rotulo}</dt>
                <dd className="num text-sm font-medium text-text">{r.valor}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <ul
          aria-label="O que acontece ao confirmar"
          className="flex list-disc flex-col gap-1 pl-5 text-sm text-text marker:text-text-muted"
        >
          {impactos.map((i) => (
            <li key={i} className="break-words">
              {i}
            </li>
          ))}
        </ul>
      </div>

      {motivo ? (
        <Field
          label={motivo.rotulo}
          requirement={motivo.obrigatorio ? "required" : "optional"}
          description={motivo.tipo === "texto" ? motivo.ajuda : undefined}
          error={erroMotivo}
        >
          {motivo.tipo === "select" ? (
            <Select
              options={motivo.opcoes}
              placeholder={motivo.placeholder ?? "Selecione o motivo"}
              value={valor}
              onValueChange={setValor}
              disabled={confirmando}
            />
          ) : (
            <Textarea
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              maxLength={motivo.maxLength}
              showCounter={motivo.maxLength !== undefined}
              disabled={confirmando}
            />
          )}
        </Field>
      ) : null}

      {fase.fase === "erro" ? (
        <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {fase.mensagem}
        </p>
      ) : null}

      <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end")}>
        {/* Foco inicial no botão seguro: o primeiro foco do Radix AlertDialog é o Cancel. */}
        <AlertPrimitive.Cancel asChild>
          <Button variant="secondary" disabled={confirmando}>
            {rotuloVoltar ?? "Voltar"}
          </Button>
        </AlertPrimitive.Cancel>
        <Button variant="destructive" loading={confirmando} onClick={confirmar}>
          {rotuloConfirmar}
        </Button>
      </div>
    </>
  );
}

/**
 * Confirmação de ação destrutiva com impacto em lista e motivo opcional/obrigatório (RF-05, RF-32, RF-48).
 * Não muda estado: emite `onConfirmar(motivo?)` e quem chama aplica a transição do domínio.
 * Esc/Voltar fecham, exceto durante `confirmando`.
 */
export function ConfirmDestructive({
  aberto,
  onAbertoChange,
  titulo,
  fase = { fase: "idle" },
  ...corpo
}: ConfirmDestructiveProps) {
  const confirmando = fase.fase === "confirmando";
  return (
    <AlertPrimitive.Root
      open={aberto}
      onOpenChange={(a) => {
        if (confirmando && !a) return;
        onAbertoChange(a);
      }}
    >
      <AlertPrimitive.Portal>
        <AlertPrimitive.Overlay className="fixed inset-0 z-(--z-modal) bg-text/40 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <AlertPrimitive.Content
          {...(corpo.descricao ? {} : { "aria-describedby": undefined })}
          onEscapeKeyDown={(e) => {
            if (confirmando) e.preventDefault();
          }}
          className={cn(
            "fixed top-1/2 left-1/2 z-(--z-modal) flex max-h-screen w-11/12 max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-surface-raised p-6 text-text shadow-3",
            "data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in",
          )}
        >
          <AlertPrimitive.Title className="text-lg font-semibold break-words">{titulo}</AlertPrimitive.Title>
          <Corpo {...corpo} fase={fase} />
        </AlertPrimitive.Content>
      </AlertPrimitive.Portal>
    </AlertPrimitive.Root>
  );
}

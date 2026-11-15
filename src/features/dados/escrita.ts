"use client";
/**
 * Escritas das telas (RF-04, RNF-18): chama o fakeApi (que chama o domínio), invalida as consultas,
 * mostra o toast e oferece "Desfazer". A tela não decide regra nenhuma aqui: só diz o texto do toast.
 */
import { useCallback, useState } from "react";
import { toast } from "@/components/ui/Toast";
import type { Escrita } from "@/mocks/services/fakeApi";
import { paraErroApi, type ErroApi } from "@/mocks/services/erros";
import { invalidarDados } from "./revisao";

export type OpcoesEscrita<T> = {
  /** Título do toast de sucesso; recebe o resultado (ex.: "Lead movido para Visita"). */
  sucesso: string | ((resultado: T) => string);
  /** Oferece "Desfazer" no toast (padrão: true). */
  desfazivel?: boolean;
  /** Título do toast de erro (padrão: "Não foi possível salvar"). A descrição é a mensagem do erro. */
  erro?: string;
  /** Não mostrar toast de erro (quem chama exibe o erro no próprio formulário/diálogo). */
  silenciarErro?: boolean;
};

export type ResultadoEscrita<T> = { fase: "ok"; resultado: T } | { fase: "erro"; erro: ErroApi };

export async function executarEscrita<T>(
  operacao: () => Promise<Escrita<T>>,
  opcoes: OpcoesEscrita<T>,
): Promise<ResultadoEscrita<T>> {
  let escrita: Escrita<T>;
  try {
    escrita = await operacao();
  } catch (e) {
    const erro = paraErroApi(e);
    if (!opcoes.silenciarErro)
      toast({ tone: "error", title: opcoes.erro ?? "Não foi possível salvar", description: erro.message });
    return { fase: "erro", erro };
  }
  invalidarDados();
  const titulo = typeof opcoes.sucesso === "function" ? opcoes.sucesso(escrita.resultado) : opcoes.sucesso;
  const id = toast({
    tone: "success",
    title: titulo,
    action:
      opcoes.desfazivel === false
        ? undefined
        : {
            label: "Desfazer",
            onClick: () => {
              toast.dismiss(id);
              escrita.desfazer().then(
                () => {
                  invalidarDados();
                  toast({ tone: "info", title: "Alteração desfeita" });
                },
                (e) =>
                  toast({ tone: "error", title: "Não foi possível desfazer", description: paraErroApi(e).message }),
              );
            },
          },
  });
  return { fase: "ok", resultado: escrita.resultado };
}

/** Fase de uma escrita em andamento, para botões e diálogos (união discriminada, sem booleanos). */
export type FaseEscrita = { fase: "idle" } | { fase: "enviando" } | { fase: "erro"; mensagem: string };

/**
 * `executarEscrita` com a fase exposta (desabilitar botão, mostrar erro no diálogo).
 * Devolve `executar`, que resolve com o `ResultadoEscrita`.
 */
export function useEscrita() {
  const [estado, setEstado] = useState<FaseEscrita>({ fase: "idle" });
  const executar = useCallback(async <T>(operacao: () => Promise<Escrita<T>>, opcoes: OpcoesEscrita<T>) => {
    setEstado({ fase: "enviando" });
    const r = await executarEscrita(operacao, opcoes);
    setEstado(r.fase === "ok" ? { fase: "idle" } : { fase: "erro", mensagem: r.erro.message });
    return r;
  }, []);
  const limpar = useCallback(() => setEstado({ fase: "idle" }), []);
  return { estado, executar, limpar };
}

"use client";
/**
 * Nova negociação do lead (RF-70, RF-71) ou definir o imóvel de uma negociação sem imóvel.
 * Combobox de imóvel como no AgendarVisita; a regra de duplicidade (uma aberta por lead × imóvel) é do
 * domínio e volta como erro `regra`, mostrado no próprio diálogo.
 */
import { useCallback, useState } from "react";
import { EstadoRecurso } from "@/components/patterns/EstadoRecurso";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { fakeApi } from "@/mocks/services/fakeApi";
import { useEscrita } from "@/features/dados/escrita";
import { useConsulta } from "@/features/dados/useConsulta";

/** "nova": cria para o lead (imóvel opcional). "definir": preenche o imóvel de uma negociação existente. */
export type ModoDialogoNegociacao = { modo: "nova"; leadId: string } | { modo: "definir"; negociacaoId: string };

const SEM_IMOVEL = "__sem_imovel";

type Props = { alvo: ModoDialogoNegociacao | null; onFechar: () => void };

export function DialogoNegociacao({ alvo, onFechar }: Props) {
  const aberto = alvo !== null;
  const nova = alvo?.modo === "nova";
  const { estado: imoveis, recarregar } = useConsulta(
    useCallback(async () => {
      if (!aberto) return [];
      const { itens } = await fakeApi.listImoveis({}, { pagina: 1, porPagina: 500 });
      return itens.map((i) => ({ value: i.id, label: `${i.codigo} · ${i.titulo}` }));
    }, [aberto]),
  );
  const [imovelId, setImovelId] = useState(nova ? SEM_IMOVEL : "");
  const [tentou, setTentou] = useState(false);
  const { estado, executar, limpar } = useEscrita();

  function fechar(a: boolean) {
    if (a || estado.fase === "enviando") return;
    limpar();
    setTentou(false);
    setImovelId("");
    onFechar();
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!alvo) return;
    setTentou(true);
    const escolhido = imovelId === SEM_IMOVEL || imovelId === "" ? null : imovelId;
    if (alvo.modo === "definir" && escolhido === null) return;
    const r = await executar(
      () =>
        alvo.modo === "nova"
          ? fakeApi.criarNegociacao(alvo.leadId, escolhido)
          : fakeApi.definirImovelNegociacao(alvo.negociacaoId, escolhido!),
      { sucesso: alvo.modo === "nova" ? "Negociação criada" : "Imóvel definido", silenciarErro: true },
    );
    if (r.fase === "ok") fechar(false);
  }

  const titulo = nova ? "Nova negociação" : "Definir imóvel";
  return (
    <Dialog open={aberto} onOpenChange={fechar}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            {nova
              ? "Abre uma negociação na coluna Novo. O imóvel pode ficar para depois."
              : "Escolha o imóvel desta negociação."}
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={(e) => void salvar(e)} className="flex flex-col gap-4">
          <Field
            label="Imóvel"
            requirement={nova ? "optional" : "required"}
            error={tentou && !nova && !imovelId ? "Escolha o imóvel." : undefined}
          >
            <EstadoRecurso
              estado={imoveis}
              carregando={<Skeleton className="h-10 w-full rounded-md" />}
              onTentarNovamente={recarregar}
              erro={{ titulo: "Não foi possível carregar os imóveis" }}
            >
              {(opcoes) => (
                <Combobox
                  options={nova ? [{ value: SEM_IMOVEL, label: "Sem imóvel (definir depois)" }, ...opcoes] : opcoes}
                  value={imovelId || (nova ? SEM_IMOVEL : "")}
                  onValueChange={setImovelId}
                  placeholder="Selecione o imóvel"
                  searchPlaceholder="Buscar por código ou título"
                />
              )}
            </EstadoRecurso>
          </Field>
          {estado.fase === "erro" ? (
            <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
              {estado.mensagem}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="secondary" onClick={() => fechar(false)} disabled={estado.fase === "enviando"}>
              Cancelar
            </Button>
            <Button type="submit" loading={estado.fase === "enviando"}>
              {nova ? "Criar negociação" : "Definir imóvel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

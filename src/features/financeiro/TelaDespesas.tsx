"use client";
/**
 * Despesas — impostos e burocracia de contratos e documentação (RF-78; RF-06 filtros na URL).
 * Status, `podeEditar` e `podePagar` vêm do domínio; lançar/editar usa o diálogo com o schema do domínio.
 */
import { Download, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CartaoFinanceiro, CartaoFinanceiroSkeleton } from "@/components/patterns/CartaoFinanceiro";
import type { DataTableColuna } from "@/components/patterns/DataTable";
import { FilterBar, type FiltroAtivo } from "@/components/patterns/FilterBar";
import { IntervaloDeDatas } from "@/components/patterns/IntervaloDeDatas";
import { CATEGORIA_DESPESA_ROTULO, STATUS_DESPESA_UI } from "@/components/patterns/rotulos";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LinkCodigo } from "@/components/patterns/LinkCodigo";
import { ListaResponsiva } from "@/components/patterns/ListaResponsiva";
import { Checkbox } from "@/components/ui/Checkbox";
import type { TableDensity } from "@/components/ui/Table";
import { toast } from "@/components/ui/Toast";
import { CATEGORIAS_DESPESA, STATUS_DESPESA, type CategoriaDespesa, type StatusDespesa } from "@/domain";
import { useAcaoEmLinha } from "@/features/dados/useAcaoEmLinha";
import { useConsulta } from "@/features/dados/useConsulta";
import { DEBOUNCE_BUSCA_MS, useParametrosUrl } from "@/features/dados/useParametrosUrl";
import { baixarCsv } from "@/lib/csv";
import { formatData, formatMoeda } from "@/lib/format";
import { usePreferencia } from "@/lib/preferencias";
import { useTelaLarga } from "@/lib/useMidia";
import { fakeApi, type FiltrosDespesas } from "@/mocks/services/fakeApi";
import { AcaoPagar } from "./AcaoPagar";
import { dataValida, filtrarConhecidos, lerPagina, POR_PAGINA } from "./compartilhado";
import { gerarCsvDespesas } from "./csv";
import { DialogoDespesa, type AlvoDespesa } from "./DialogoDespesa";
import type { LinhaDespesa } from "./tipos";

export function TelaDespesas() {
  const url = useParametrosUrl();
  const { estado: pagamento, executar } = useAcaoEmLinha();
  const telaLarga = useTelaLarga();
  const [densidade] = usePreferencia<TableDensity>("densidade", "comfortable");
  const [alvo, setAlvo] = useState<AlvoDespesa | null>(null);

  const busca = url.ler("busca") ?? "";
  const categoriasChave = filtrarConhecidos(url.lerLista("categoria"), CATEGORIAS_DESPESA).join(",");
  const statusChave = filtrarConhecidos(url.lerLista("status"), STATUS_DESPESA).join(",");
  const de = dataValida(url.ler("de"));
  const ate = dataValida(url.ler("ate"));
  const pagina = lerPagina(url.ler("pagina"));

  const categorias = useMemo(
    () => (categoriasChave ? (categoriasChave.split(",") as CategoriaDespesa[]) : []),
    [categoriasChave],
  );
  const status = useMemo(() => (statusChave ? (statusChave.split(",") as StatusDespesa[]) : []), [statusChave]);
  const filtros = useMemo<FiltrosDespesas>(
    () => ({
      busca: busca || undefined,
      categorias: categorias.length ? categorias : undefined,
      status: status.length ? status : undefined,
      vencimentoDe: de,
      vencimentoAte: ate,
    }),
    [busca, categorias, status, de, ate],
  );

  const carregar = useCallback(
    () => fakeApi.listDespesas(filtros, { pagina, porPagina: POR_PAGINA }),
    [filtros, pagina],
  );
  const { estado, recarregar } = useConsulta(carregar);
  const total = "dados" in estado && estado.dados ? estado.dados.total : undefined;

  const alternarCategoria = (c: CategoriaDespesa, marcado: boolean) =>
    url.definir({ categoria: marcado ? [...categorias, c] : categorias.filter((x) => x !== c) });
  const alternarStatus = (s: StatusDespesa, marcado: boolean) =>
    url.definir({ status: marcado ? [...status, s] : status.filter((x) => x !== s) });

  const ativos: FiltroAtivo[] = [
    ...categorias.map((c) => ({
      id: `categoria-${c}`,
      rotulo: `Categoria: ${CATEGORIA_DESPESA_ROTULO[c]}`,
      onRemover: () => alternarCategoria(c, false),
    })),
    ...status.map((s) => ({
      id: `status-${s}`,
      rotulo: `Status: ${STATUS_DESPESA_UI[s].rotulo}`,
      onRemover: () => alternarStatus(s, false),
    })),
    ...(de
      ? [{ id: "de", rotulo: `Vence a partir de ${formatData(de)}`, onRemover: () => url.definir({ de: undefined }) }]
      : []),
    ...(ate
      ? [{ id: "ate", rotulo: `Vence até ${formatData(ate)}`, onRemover: () => url.definir({ ate: undefined }) }]
      : []),
  ];
  const limparFiltros = () =>
    url.definir({ categoria: undefined, status: undefined, de: undefined, ate: undefined, busca: undefined });
  const temFiltro = ativos.length > 0 || busca !== "";

  const exportar = () =>
    fakeApi.listDespesas(filtros, { pagina: 1, porPagina: 100_000 }).then(
      (todas) => {
        baixarCsv("despesas.csv", gerarCsvDespesas(todas.itens));
        toast({ tone: "success", title: "CSV gerado", description: `${todas.itens.length} despesas.` });
      },
      () => toast({ tone: "error", title: "Não foi possível gerar o CSV", description: "Tente de novo." }),
    );

  const acoes = (l: LinhaDespesa) => (
    <div className="flex items-center justify-end gap-2">
      {l.podeEditar.ok ? (
        <Button
          variant="ghost"
          size="touch"
          aria-label={`Editar despesa ${l.descricao}`}
          onClick={() => setAlvo({ modo: "editar", despesa: l })}
        >
          Editar
        </Button>
      ) : null}
      <AcaoPagar
        permissao={l.podePagar}
        id={l.id}
        rotulo="Registrar pagamento"
        rotuloAcessivel={`Registrar pagamento da despesa ${l.descricao}`}
        andamento={pagamento}
        onPagar={() => void executar(l.id, () => fakeApi.pagarDespesa(l.id), { sucesso: "Pagamento registrado" })}
      />
    </div>
  );

  const colunas: DataTableColuna<LinhaDespesa>[] = [
    {
      id: "descricao",
      cabecalho: "Despesa",
      className: "min-w-48 max-w-72",
      celula: (l) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="line-clamp-2 break-words">{l.descricao}</span>
          <span className="text-xs text-text-muted">{CATEGORIA_DESPESA_ROTULO[l.categoria]}</span>
        </div>
      ),
    },
    {
      id: "contrato",
      cabecalho: "Contrato",
      celula: (l) =>
        l.contrato ? (
          <LinkCodigo href={`/contratos/${l.contrato.id}`}>{l.contrato.numero}</LinkCodigo>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      id: "vencimento",
      cabecalho: "Vencimento",
      celula: (l) => <span className="tnum whitespace-nowrap">{formatData(l.vencimento)}</span>,
    },
    {
      id: "valor",
      cabecalho: "Valor",
      alinhamento: "direita",
      celula: (l) => <span className="whitespace-nowrap">{formatMoeda(l.valor)}</span>,
    },
    {
      id: "status",
      cabecalho: "Status",
      celula: (l) => <Badge tone={STATUS_DESPESA_UI[l.status].tom}>{STATUS_DESPESA_UI[l.status].rotulo}</Badge>,
    },
    { id: "acoes", cabecalho: <span className="sr-only">Ações</span>, alinhamento: "direita", celula: acoes },
  ];

  const filtrosPopover = (
    <>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-text">Categoria</legend>
        {CATEGORIAS_DESPESA.map((c) => (
          <Checkbox
            key={c}
            label={CATEGORIA_DESPESA_ROTULO[c]}
            checked={categorias.includes(c)}
            onCheckedChange={(m) => alternarCategoria(c, m === true)}
          />
        ))}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-text">Status</legend>
        {STATUS_DESPESA.map((s) => (
          <Checkbox
            key={s}
            label={STATUS_DESPESA_UI[s].rotulo}
            checked={status.includes(s)}
            onCheckedChange={(m) => alternarStatus(s, m === true)}
          />
        ))}
      </fieldset>
      <IntervaloDeDatas
        rotulo="Vencimento"
        de={de ?? ""}
        ate={ate ?? ""}
        onDeChange={(v) => url.definir({ de: v })}
        onAteChange={(v) => url.definir({ ate: v })}
      />
    </>
  );

  return (
    <>
      <PageHeader
        eyebrow="Financeiro · despesas"
        titulo="Despesas"
        acaoPrimaria={
          <Button size="touch" leadingIcon={Plus} onClick={() => setAlvo({ modo: "nova" })}>
            Nova despesa
          </Button>
        }
        acoes={
          <Button variant="secondary" leadingIcon={Download} onClick={() => void exportar()} disabled={!total}>
            Exportar CSV
          </Button>
        }
      />
      <div className="flex min-w-0 flex-col gap-4">
        <FilterBar
          busca={busca}
          onBuscaChange={(b) => url.definir({ busca: b })}
          debounceMs={DEBOUNCE_BUSCA_MS}
          rotuloBusca="Buscar despesas"
          placeholderBusca="Descrição ou contrato"
          filtros={filtrosPopover}
          ativos={ativos}
          onLimparTudo={limparFiltros}
          total={total}
          estado={estado.fase === "loading" ? "carregando" : "pronto"}
          rotuloItem={["despesa", "despesas"]}
        />
        <ListaResponsiva
          telaLarga={telaLarga}
          densidade={densidade}
          cartaoCarregando={<CartaoFinanceiroSkeleton />}
          rotulo="Despesas"
          colunas={colunas}
          idLinha={(l) => l.id}
          estado={estado}
          onTentarNovamente={recarregar}
          onPaginaChange={(p) => url.definir({ pagina: String(p) })}
          vazio={{
            titulo: temFiltro ? "Nenhuma despesa com esses filtros" : "Nenhuma despesa ainda",
            acao: temFiltro ? (
              <Button variant="secondary" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            ) : (
              <Button size="touch" leadingIcon={Plus} onClick={() => setAlvo({ modo: "nova" })}>
                Nova despesa
              </Button>
            ),
          }}
          cartao={(l) => (
            <CartaoFinanceiro
              titulo={l.descricao}
              subtitulo={CATEGORIA_DESPESA_ROTULO[l.categoria]}
              status={STATUS_DESPESA_UI[l.status]}
              campos={[
                { rotulo: "Vencimento", valor: formatData(l.vencimento) },
                { rotulo: "Valor", valor: formatMoeda(l.valor) },
                ...(l.contrato ? [{ rotulo: "Contrato", valor: l.contrato.numero }] : []),
              ]}
              acao={acoes(l)}
            />
          )}
        />
      </div>
      <DialogoDespesa alvo={alvo} onFechar={() => setAlvo(null)} />
    </>
  );
}

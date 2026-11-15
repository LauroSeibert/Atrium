"use client";
/**
 * Imóveis (RF-20…23, RF-28, RF-49, RF-06, RF-08). Contêiner: filtros, ordem, página e visualização na URL;
 * seleção em lote só na lista (tabela). Mudança de status e a lista de destinos vêm do domínio.
 */
import Link from "next/link";
import { Download, LayoutGrid, List, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/patterns/EmptyState";
import { EstadoRecurso } from "@/components/patterns/EstadoRecurso";
import { DataTable, type DataTableAcaoEmLote, type DataTableColuna } from "@/components/patterns/DataTable";
import { FilterBar, type FiltroAtivo } from "@/components/patterns/FilterBar";
import {
  PropertyCard,
  PropertyCardSkeleton,
  BotaoFavorito,
  MenuAcoesImovel,
  type AcaoImovel,
} from "@/components/patterns/PropertyCard";
import { PropertyRow, PropertyRowSkeleton } from "@/components/patterns/PropertyRow";
import { FINALIDADE_ROTULO, STATUS_IMOVEL_UI } from "@/components/patterns/rotulos";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import type { TableDensity } from "@/components/ui/Table";
import { toast } from "@/components/ui/Toast";
import { PERMITIDO, type Corretor } from "@/domain";
import { formatArea, formatMoeda } from "@/lib/format";
import { usePreferencia } from "@/lib/preferencias";
import { fakeApi, type OrdemImoveis } from "@/mocks/services/fakeApi";
import { executarEscrita } from "@/features/dados/escrita";
import { useConsulta } from "@/features/dados/useConsulta";
import { DEBOUNCE_BUSCA_MS, useParametrosUrl } from "@/features/dados/useParametrosUrl";
import { AcaoLink } from "@/features/shell/AcaoLink";
import { baixarCsv, gerarCsvImoveis } from "./csv";
import { DialogoStatusImovel, type AlvoStatus } from "./DialogoStatusImovel";
import { FiltrosAvancados, FiltrosPrincipais } from "./ControlesFiltros";
import {
  CHAVES_FILTRO,
  construirChips,
  lerParametros,
  paraFiltrosApi,
  POR_PAGINA,
  VISUALIZACOES,
  type Visualizacao,
} from "./filtros";
import { opcoesDeStatus, type ImovelComTransicoes } from "./statusImovel";

const ROTULO_ORDEM: { value: OrdemImoveis; label: string }[] = [
  { value: "recentes", label: "Mais recentes" },
  { value: "precoAsc", label: "Menor preço" },
  { value: "precoDesc", label: "Maior preço" },
  { value: "area", label: "Maior área" },
];

const assinarMedia = (consulta: string) => (avisar: () => void) => {
  if (typeof window.matchMedia !== "function") return () => {};
  const m = window.matchMedia(consulta);
  m.addEventListener("change", avisar);
  return () => m.removeEventListener("change", avisar);
};

/** `true` a partir de 768 px (tabela); abaixo, a lista vira cartões. Sem matchMedia (jsdom) vale desktop. */
function useTelaLarga(): boolean {
  const consulta = "(min-width: 768px)";
  return useSyncExternalStore(
    useMemo(() => assinarMedia(consulta), []),
    () => (typeof window.matchMedia === "function" ? window.matchMedia(consulta).matches : true),
    () => true,
  );
}

function SkeletonListagem() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando imóveis" className="flex flex-col gap-4">
      <Skeleton className="h-10 w-full rounded-md" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 6 }, (_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function TelaImoveis() {
  const perfil = useConsulta(useCallback(() => fakeApi.getPerfil(), []));
  return (
    <>
      <PageHeader
        titulo="Imóveis"
        acaoPrimaria={
          <AcaoLink href="/imoveis/novo" icone={Plus}>
            Novo imóvel
          </AcaoLink>
        }
      />
      <EstadoRecurso
        estado={perfil.estado}
        carregando={<SkeletonListagem />}
        onTentarNovamente={perfil.recarregar}
        erro={{ titulo: "Não foi possível carregar os imóveis" }}
      >
        {(usuario) => <Listagem usuario={usuario} />}
      </EstadoRecurso>
    </>
  );
}

function Listagem({ usuario }: { usuario: Corretor }) {
  const url = useParametrosUrl();
  const { definir } = url;
  const textoUrl = url.busca.toString();
  const p = useMemo(() => lerParametros(new URLSearchParams(textoUrl)), [textoUrl]);
  const telaLarga = useTelaLarga();

  const [prefView, gravarView] = usePreferencia<string>("imoveis-visualizacao", "grade");
  const [densidade] = usePreferencia<TableDensity>("densidade", "comfortable");
  const view: Visualizacao =
    p.view ?? ((VISUALIZACOES as readonly string[]).includes(prefView) ? (prefView as Visualizacao) : "grade");
  // A preferência vale quando a URL não diz nada: reflete na URL (RF-20, RF-06).
  const pagina = p.pagina;
  useEffect(() => {
    if (!p.view && view !== "grade") definir({ view, pagina: String(pagina) });
  }, [p.view, view, pagina, definir]);

  // Recorte padrão da persona (RF-08): corretor vê os dele; `corretor=todos` desfaz.
  const corretorEfetivo =
    p.corretor === "todos" ? undefined : (p.corretor ?? (usuario.papel === "corretor" ? usuario.id : undefined));

  const corretores = useConsulta(useCallback(() => fakeApi.listCorretores(), []));
  const bairros = useConsulta(useCallback(() => fakeApi.listBairros(), []));
  const listaCorretores = useMemo(
    () => ("dados" in corretores.estado ? (corretores.estado.dados ?? []) : []),
    [corretores.estado],
  );
  const nomeDe = useCallback((id: string) => listaCorretores.find((c) => c.id === id)?.nome, [listaCorretores]);
  const listaBairros = "dados" in bairros.estado ? (bairros.estado.dados ?? []) : [];

  const chaveFiltros = JSON.stringify([p, corretorEfetivo]);
  const carregar = useCallback(
    () => fakeApi.listImoveis(paraFiltrosApi(p, corretorEfetivo), { pagina, porPagina: POR_PAGINA }, p.ordem),
    // `p` só muda com a URL; a chave serializada evita refazer a busca por identidade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chaveFiltros, pagina],
  );
  const { estado, recarregar } = useConsulta(carregar);
  const dados = "dados" in estado ? estado.dados : undefined;

  // Seleção em lote (RF-49): guarda o imóvel junto do id para saber as opções mesmo entre páginas.
  const [selecao, setSelecao] = useState<Record<string, ImovelComTransicoes>>({});
  const idsSelecionados = Object.keys(selecao);
  const aoSelecionar = (ids: string[]) =>
    setSelecao((anterior) => {
      const daPagina = dados?.itens ?? [];
      const proxima: Record<string, ImovelComTransicoes> = {};
      for (const id of ids) {
        const i = daPagina.find((x) => x.id === id) ?? anterior[id];
        if (i) proxima[id] = i;
      }
      return proxima;
    });

  const [alvoStatus, setAlvoStatus] = useState<AlvoStatus | null>(null);

  const alternarFavorito = useCallback(
    (id: string) =>
      void executarEscrita(() => fakeApi.toggleFavorito(id), {
        sucesso: (i) => (i.favorito ? `${i.codigo} nos favoritos` : `${i.codigo} fora dos favoritos`),
      }),
    [],
  );

  const acoesDoImovel = (imovel: ImovelComTransicoes): AcaoImovel[] =>
    opcoesDeStatus([imovel])
      .filter((o) => o.permissao.ok)
      .map((o) => ({
        id: `status-${o.para}`,
        rotulo: `Marcar como ${STATUS_IMOVEL_UI[o.para].rotulo.toLowerCase()}`,
        permissao: o.permissao,
        destrutiva: o.exigeMotivo,
        onSelect: () =>
          setAlvoStatus({ imoveis: [imovel], para: o.para, exigeMotivo: o.exigeMotivo, aplicaveis: o.aplicaveis }),
      }));

  const acoesEmLote: DataTableAcaoEmLote[] = [
    {
      id: "csv",
      rotulo: "Exportar CSV",
      icone: Download,
      permissao: PERMITIDO,
      onExecutar: (ids) => {
        const escolhidos = ids.map((id) => selecao[id]).filter((i): i is ImovelComTransicoes => !!i);
        baixarCsv(gerarCsvImoveis(escolhidos, nomeDe), "imoveis.csv");
        toast({
          tone: "success",
          title: `${escolhidos.length} ${escolhidos.length === 1 ? "imóvel exportado" : "imóveis exportados"}`,
        });
      },
    },
    ...opcoesDeStatus(Object.values(selecao)).map<DataTableAcaoEmLote>((o) => ({
      id: `status-${o.para}`,
      rotulo: `Marcar como ${STATUS_IMOVEL_UI[o.para].rotulo.toLowerCase()}`,
      permissao: o.permissao,
      onExecutar: () =>
        setAlvoStatus({
          imoveis: Object.values(selecao),
          para: o.para,
          exigeMotivo: o.exigeMotivo,
          aplicaveis: o.aplicaveis,
        }),
    })),
  ];

  const chips = construirChips(p, corretorEfetivo, (id) => nomeDe(id) ?? "—", usuario.id);
  const ativos: FiltroAtivo[] = chips.map((c) => ({ id: c.id, rotulo: c.rotulo, onRemover: () => definir(c.remover) }));
  const limparTudo = () =>
    definir({ ...Object.fromEntries(CHAVES_FILTRO.map((k) => [k, undefined])), corretor: "todos" });
  const semFiltros = ativos.length === 0 && p.busca.trim() === "";
  const aoBuscar = useCallback((q: string) => definir({ q }), [definir]);

  const vazio = semFiltros ? (
    <EmptyState
      titulo="Nenhum imóvel cadastrado"
      descricao="Cadastre o primeiro imóvel para começar."
      acao={
        <AcaoLink href="/imoveis/novo" icone={Plus}>
          Novo imóvel
        </AcaoLink>
      }
    />
  ) : (
    <EmptyState
      titulo="Nenhum imóvel encontrado"
      descricao="Nenhum imóvel combina com a busca e os filtros."
      acao={
        <Button variant="secondary" onClick={limparTudo}>
          Limpar filtros
        </Button>
      }
    />
  );

  const mostrarTabela = view === "lista" && telaLarga;
  const colunas: DataTableColuna<ImovelComTransicoes>[] = [
    {
      id: "imovel",
      cabecalho: "Imóvel",
      className: "min-w-64",
      celula: (i) => (
        <div className="flex min-w-0 flex-col">
          <Link
            href={`/imoveis/${i.id}`}
            className="line-clamp-2 font-medium text-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            title={i.titulo}
          >
            {i.titulo}
          </Link>
          <span className="tnum text-xs text-text-muted">
            {i.codigo} · {i.endereco.bairro}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      cabecalho: "Status",
      celula: (i) => (
        <Badge tone={STATUS_IMOVEL_UI[i.status].tom} size="sm" dot>
          {STATUS_IMOVEL_UI[i.status].rotulo}
        </Badge>
      ),
    },
    { id: "finalidade", cabecalho: "Finalidade", celula: (i) => FINALIDADE_ROTULO[i.finalidade] },
    {
      id: "preco",
      cabecalho: "Preço",
      alinhamento: "direita",
      ordenavel: true,
      celula: (i) => (
        <span className="tnum">
          {formatMoeda(i.preco, { semCentavos: true })}
          {i.finalidade === "locacao" ? <span className="text-text-muted">/mês</span> : null}
        </span>
      ),
    },
    {
      id: "area",
      cabecalho: "Área útil",
      alinhamento: "direita",
      ordenavel: true,
      celula: (i) => <span className="tnum">{formatArea(i.areaUtil)}</span>,
    },
    {
      id: "quartos",
      cabecalho: "Quartos",
      alinhamento: "direita",
      celula: (i) => <span className="tnum">{i.quartos}</span>,
    },
    {
      id: "corretor",
      cabecalho: "Corretor",
      celula: (i) => <span className="text-text-muted">{nomeDe(i.corretorId) ?? "—"}</span>,
    },
    {
      id: "acoes",
      cabecalho: <span className="sr-only">Ações</span>,
      alinhamento: "direita",
      celula: (i) => (
        <div className="flex justify-end gap-2">
          <BotaoFavorito imovel={i} onAlternarFavorito={alternarFavorito} />
          <MenuAcoesImovel imovel={i} acoes={acoesDoImovel(i)} />
        </div>
      ),
    },
  ];

  const mudarView = (v: Visualizacao) => {
    gravarView(v);
    definir({ view: v });
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <FilterBar
        busca={p.busca}
        onBuscaChange={aoBuscar}
        debounceMs={DEBOUNCE_BUSCA_MS}
        rotuloBusca="Buscar imóveis"
        placeholderBusca="Código, título ou bairro"
        filtros={<FiltrosPrincipais p={p} onMudar={definir} />}
        maisFiltros={
          <FiltrosAvancados
            p={p}
            bairros={listaBairros}
            corretores={listaCorretores}
            corretorEfetivo={corretorEfetivo}
            onMudar={definir}
          />
        }
        ativos={ativos}
        onLimparTudo={limparTudo}
        total={dados?.total}
        estado={estado.fase === "loading" ? "carregando" : "pronto"}
        rotuloItem={["imóvel", "imóveis"]}
        ordenacao={
          <Select
            aria-label="Ordenar por"
            value={p.ordem}
            onValueChange={(v) => definir({ ordem: v === "recentes" ? undefined : v })}
            options={ROTULO_ORDEM}
          />
        }
        visualizacao={
          <SegmentedControl
            aria-label="Modo de visualização"
            value={view}
            onValueChange={mudarView}
            options={[
              { value: "grade", label: "Grade", icon: LayoutGrid, hideLabel: true },
              { value: "lista", label: "Lista", icon: List, hideLabel: true },
            ]}
          />
        }
      />

      <section aria-label="Lista de imóveis" className="min-w-0">
        {mostrarTabela ? (
          <DataTable<ImovelComTransicoes>
            aria-label="Imóveis"
            colunas={colunas}
            idLinha={(i) => i.id}
            estado={estado}
            onTentarNovamente={recarregar}
            densidade={densidade}
            ordenacao={
              p.ordem === "precoAsc"
                ? { id: "preco", direcao: "ascending" }
                : p.ordem === "precoDesc"
                  ? { id: "preco", direcao: "descending" }
                  : p.ordem === "area"
                    ? { id: "area", direcao: "descending" }
                    : null
            }
            onOrdenacaoChange={({ id, direcao }) =>
              definir({ ordem: id === "area" ? "area" : direcao === "ascending" ? "precoAsc" : "precoDesc" })
            }
            selecionados={idsSelecionados}
            onSelecaoChange={aoSelecionar}
            rotuloSelecao={(i) => `Selecionar ${i.codigo}`}
            acoesEmLote={acoesEmLote}
            onPaginaChange={(n) => definir({ pagina: String(n) })}
            linhasSkeleton={POR_PAGINA}
            vazio={{
              titulo: semFiltros ? "Nenhum imóvel cadastrado" : "Nenhum imóvel encontrado",
              descricao: semFiltros
                ? "Cadastre o primeiro imóvel para começar."
                : "Nenhum imóvel combina com a busca e os filtros.",
              acao: semFiltros ? (
                <AcaoLink href="/imoveis/novo" icone={Plus}>
                  Novo imóvel
                </AcaoLink>
              ) : (
                <Button variant="secondary" onClick={limparTudo}>
                  Limpar filtros
                </Button>
              ),
            }}
          />
        ) : (
          <EstadoRecurso
            estado={estado}
            carregando={
              <div
                role="status"
                aria-busy="true"
                aria-label="Carregando imóveis"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              >
                {Array.from({ length: 6 }, (_, i) =>
                  view === "lista" ? (
                    <PropertyRowSkeleton key={i} className="sm:col-span-full" />
                  ) : (
                    <PropertyCardSkeleton key={i} />
                  ),
                )}
              </div>
            }
            estaVazio={(d) => d.total === 0}
            vazio={vazio}
            onTentarNovamente={recarregar}
            erro={{ titulo: "Não foi possível carregar os imóveis" }}
          >
            {(d) => (
              <div className="flex min-w-0 flex-col gap-4">
                <ul
                  aria-label="Imóveis"
                  className={
                    view === "lista"
                      ? "flex flex-col gap-3"
                      : "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                  }
                >
                  {d.itens.map((i) => {
                    const props = {
                      imovel: i,
                      corretor: listaCorretores.find((c) => c.id === i.corretorId),
                      href: `/imoveis/${i.id}`,
                      acoes: acoesDoImovel(i),
                      onAlternarFavorito: alternarFavorito,
                    };
                    return (
                      <li key={i.id} className="flex min-w-0 *:min-w-0 *:flex-1">
                        {view === "lista" ? <PropertyRow {...props} /> : <PropertyCard {...props} />}
                      </li>
                    );
                  })}
                </ul>
                <Pagination
                  page={d.pagina}
                  pageCount={d.totalPaginas}
                  pageSize={d.porPagina}
                  total={d.total}
                  onPageChange={(n) => definir({ pagina: String(n) })}
                  className="min-w-0 justify-center sm:justify-between [&_ul]:flex-wrap [&_ul]:justify-center"
                />
              </div>
            )}
          </EstadoRecurso>
        )}
      </section>

      <DialogoStatusImovel alvo={alvoStatus} onFechar={() => setAlvoStatus(null)} onConcluir={() => setSelecao({})} />
    </div>
  );
}

"use client";
/**
 * Contatos (RF-74; RF-06 busca, papel e página na URL; RF-09 densidade): pessoas fora do funil.
 * Criar e editar em diálogo. Abaixo de 768 px a lista vira cartões.
 */
import { Pencil, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContatoCard, ContatoCardSkeleton } from "@/components/patterns/ContatoCard";
import type { DataTableColuna } from "@/components/patterns/DataTable";
import { FilterBar, type FiltroAtivo } from "@/components/patterns/FilterBar";
import { ListaResponsiva } from "@/components/patterns/ListaResponsiva";
import { PAPEL_CONTATO_ROTULO } from "@/components/patterns/rotulos";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import type { TableDensity } from "@/components/ui/Table";
import { PAPEIS_CONTATO, type Contato, type PapelContato } from "@/domain";
import { useConsulta } from "@/features/dados/useConsulta";
import { DEBOUNCE_BUSCA_MS, useParametrosUrl } from "@/features/dados/useParametrosUrl";
import { formatTelefone } from "@/lib/format";
import { paginar, type Pagina } from "@/lib/paginacao";
import { usePreferencia } from "@/lib/preferencias";
import { useTelaLarga } from "@/lib/useMidia";
import { mapear, type Recurso } from "@/lib/recurso";
import { fakeApi } from "@/mocks/services/fakeApi";
import { DialogoContato } from "./DialogoContato";

const POR_PAGINA = 10;
const ePapel = (v: string): v is PapelContato => (PAPEIS_CONTATO as readonly string[]).includes(v);

/** Dentro do diálogo: `null` = fechado, `"novo"` = criação, contato = edição. */
type Edicao = null | "novo" | Contato;

export function TelaContatos() {
  const url = useParametrosUrl();
  const [densidade] = usePreferencia<TableDensity>("densidade", "comfortable");
  const telaLarga = useTelaLarga();
  const [edicao, setEdicao] = useState<Edicao>(null);

  const busca = url.ler("busca") ?? "";
  const papelChave = url.lerLista("papel").filter(ePapel).join(",");
  const papeis = useMemo(() => (papelChave ? (papelChave.split(",") as PapelContato[]) : []), [papelChave]);
  const pagina = Math.max(1, Number.parseInt(url.ler("pagina") ?? "1", 10) || 1);

  const carregar = useCallback(
    () => fakeApi.listContatos({ busca: busca || undefined, papeis: papeis.length ? papeis : undefined }),
    [busca, papeis],
  );
  const { estado: bruto, recarregar } = useConsulta(carregar);

  const estado = useMemo(
    (): Recurso<Pagina<Contato>> => mapear(bruto, (lista) => paginar(lista, { pagina, porPagina: POR_PAGINA })),
    [bruto, pagina],
  );

  const total = "dados" in estado && estado.dados ? estado.dados.total : undefined;

  const alternarPapel = (p: PapelContato, marcado: boolean) =>
    url.definir({ papel: marcado ? [...papeis, p] : papeis.filter((x) => x !== p) });
  const ativos: FiltroAtivo[] = papeis.map((p) => ({
    id: `papel-${p}`,
    rotulo: `Papel: ${PAPEL_CONTATO_ROTULO[p]}`,
    onRemover: () => alternarPapel(p, false),
  }));
  const limparFiltros = () => url.definir({ papel: undefined, busca: undefined });
  const temFiltro = ativos.length > 0 || busca !== "";

  const abrirEdicao = (c: Contato) => setEdicao(c);
  const botaoEditar = (c: Contato) => (
    <Button
      variant="ghost"
      leadingIcon={Pencil}
      onClick={() => abrirEdicao(c)}
      aria-label={`Editar ${c.nome}`}
      size="touch"
    >
      Editar
    </Button>
  );

  const colunas: DataTableColuna<Contato>[] = [
    {
      id: "nome",
      cabecalho: "Nome",
      className: "min-w-40 max-w-64",
      celula: (c) => (
        <span className="flex items-center gap-3">
          <Avatar name={c.nome} size={32} aria-hidden className="border border-border" />
          <span className="line-clamp-2 text-md font-medium break-words">{c.nome}</span>
        </span>
      ),
    },
    { id: "papel", cabecalho: "Papel", celula: (c) => <Badge tone="neutral">{PAPEL_CONTATO_ROTULO[c.papel]}</Badge> },
    {
      id: "telefone",
      cabecalho: "Telefone",
      celula: (c) =>
        c.telefone ? (
          <span className="num whitespace-nowrap text-caption">{formatTelefone(c.telefone)}</span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      id: "email",
      cabecalho: "E-mail",
      className: "min-w-56 max-w-72",
      celula: (c) =>
        c.email ? <span className="break-words">{c.email}</span> : <span className="text-text-muted">—</span>,
    },
    {
      id: "vinculos",
      cabecalho: "Vínculos",
      celula: (c) => (
        <span className="num whitespace-nowrap text-caption text-text-muted">
          {c.imovelIds.length} imóv. · {c.contratoIds.length} contr.
        </span>
      ),
    },
    { id: "acoes", cabecalho: <span className="sr-only">Ações</span>, alinhamento: "direita", celula: botaoEditar },
  ];

  const vazio = {
    titulo: temFiltro ? "Nenhum contato com esses filtros" : "Nenhum contato ainda",
    acao: temFiltro ? (
      <Button variant="secondary" onClick={limparFiltros}>
        Limpar filtros
      </Button>
    ) : (
      <Button size="touch" leadingIcon={Plus} onClick={() => setEdicao("novo")}>
        Novo contato
      </Button>
    ),
  };

  const filtrosPopover = (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-text">Papel</legend>
      {PAPEIS_CONTATO.map((p) => (
        <Checkbox
          key={p}
          label={PAPEL_CONTATO_ROTULO[p]}
          checked={papeis.includes(p)}
          onCheckedChange={(m) => alternarPapel(p, m === true)}
        />
      ))}
    </fieldset>
  );

  return (
    <>
      <PageHeader
        eyebrow="Comercial · pessoas"
        titulo="Contatos"
        acaoPrimaria={
          <Button size="touch" leadingIcon={Plus} onClick={() => setEdicao("novo")}>
            Novo contato
          </Button>
        }
      />
      <div className="flex min-w-0 flex-col gap-4">
        <FilterBar
          busca={busca}
          onBuscaChange={(b) => url.definir({ busca: b })}
          debounceMs={DEBOUNCE_BUSCA_MS}
          rotuloBusca="Buscar contatos"
          placeholderBusca="Nome, e-mail ou telefone"
          filtros={filtrosPopover}
          ativos={ativos}
          onLimparTudo={limparFiltros}
          total={total}
          estado={estado.fase === "loading" ? "carregando" : "pronto"}
          rotuloItem={["contato", "contatos"]}
        />

        <ListaResponsiva
          rotulo="Contatos"
          telaLarga={telaLarga}
          densidade={densidade}
          colunas={colunas}
          idLinha={(c) => c.id}
          estado={estado}
          onTentarNovamente={recarregar}
          onPaginaChange={(p) => url.definir({ pagina: String(p) })}
          vazio={vazio}
          cartaoCarregando={<ContatoCardSkeleton />}
          cartao={(c) => (
            <ContatoCard
              nome={c.nome}
              papel={PAPEL_CONTATO_ROTULO[c.papel]}
              telefone={c.telefone}
              email={c.email}
              observacao={c.observacao}
              qtdImoveis={c.imovelIds.length}
              qtdContratos={c.contratoIds.length}
              acao={botaoEditar(c)}
            />
          )}
        />
      </div>
      <DialogoContato
        aberto={edicao !== null}
        contato={edicao === null || edicao === "novo" ? null : edicao}
        onAbertoChange={(a) => !a && setEdicao(null)}
      />
    </>
  );
}

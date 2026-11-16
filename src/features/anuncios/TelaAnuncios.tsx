"use client";
/**
 * Anúncios (RF-75, demonstração): um anúncio por imóvel × canal.
 * O que cada linha pode fazer vem de `transicoes` (domínio); o alerta "imóvel indisponível" é derivado no fakeApi.
 */
import { TriangleAlert } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { rotaDoImovel } from "@/components/layout/navegacao";
import { ConfirmDestructive } from "@/components/patterns/ConfirmDestructive";
import { DataTable, type DataTableColuna } from "@/components/patterns/DataTable";
import { EstadoRecurso } from "@/components/patterns/EstadoRecurso";
import { FilterBar, type FiltroAtivo } from "@/components/patterns/FilterBar";
import { LinkCodigo } from "@/components/patterns/LinkCodigo";
import { CANAL_ANUNCIO_ROTULO, STATUS_ANUNCIO_UI } from "@/components/patterns/rotulos";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import type { TableDensity } from "@/components/ui/Table";
import { CANAIS_ANUNCIO, STATUS_ANUNCIO, type CanalAnuncio, type StatusAnuncio } from "@/domain";
import { faseConfirmacaoDe, useEscrita } from "@/features/dados/escrita";
import { enviandoLinha, useAcaoEmLinha } from "@/features/dados/useAcaoEmLinha";
import { useConsulta } from "@/features/dados/useConsulta";
import { DEBOUNCE_BUSCA_MS, useParametrosUrl } from "@/features/dados/useParametrosUrl";
import { formatData, formatNumero } from "@/lib/format";
import { usePreferencia } from "@/lib/preferencias";
import { fakeApi } from "@/mocks/services/fakeApi";

type Linha = Awaited<ReturnType<typeof fakeApi.listAnuncios>>[number];

const eCanal = (v: string): v is CanalAnuncio => (CANAIS_ANUNCIO as readonly string[]).includes(v);
const eStatus = (v: string): v is StatusAnuncio => (STATUS_ANUNCIO as readonly string[]).includes(v);

/** Rótulo do botão por mudança (apresentação; quem permite é o domínio via `transicoes`). */
const ROTULO_ACAO: Record<StatusAnuncio, Partial<Record<StatusAnuncio, string>>> = {
  rascunho: { publicado: "Publicar", encerrado: "Encerrar" },
  publicado: { pausado: "Pausar", encerrado: "Encerrar" },
  pausado: { publicado: "Retomar", encerrado: "Encerrar" },
  encerrado: {},
};
const SUCESSO: Record<StatusAnuncio, string> = {
  rascunho: "Anúncio em rascunho",
  publicado: "Anúncio publicado",
  pausado: "Anúncio pausado",
  encerrado: "Anúncio encerrado",
};

/** Formulário do diálogo: só existe (e só carrega os imóveis) enquanto o diálogo está aberto. */
function FormularioNovoAnuncio({ onFechar }: { onFechar: () => void }) {
  const [imovelId, setImovelId] = useState("");
  const [canal, setCanal] = useState<CanalAnuncio | "">("");
  const [tentou, setTentou] = useState(false);
  const escrita = useEscrita();
  const carregar = useCallback(
    async () =>
      (await fakeApi.listImoveis({}, { pagina: 1, porPagina: 100_000 })).itens.map((i) => ({
        value: i.id,
        label: `${i.codigo} · ${i.titulo}`,
      })),
    [],
  );
  const { estado, recarregar } = useConsulta(carregar);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    setTentou(true);
    if (!imovelId || !canal) return;
    const r = await escrita.executar(() => fakeApi.criarAnuncio(imovelId, canal), {
      sucesso: "Anúncio criado",
      silenciarErro: true,
    });
    if (r.fase === "ok") onFechar();
  };

  return (
    <form onSubmit={criar} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Novo anúncio</DialogTitle>
        <DialogDescription className="sr-only">Escolha o imóvel e o canal.</DialogDescription>
      </DialogHeader>
      <EstadoRecurso
        estado={estado}
        carregando={<Skeleton shape="rect" role="status" aria-label="Carregando imóveis" className="h-16 rounded-md" />}
        erro={{ titulo: "Não foi possível carregar os imóveis", tamanho: "compacto" }}
        onTentarNovamente={recarregar}
      >
        {(opcoes) => (
          <Field label="Imóvel" error={tentou && !imovelId ? "Escolha o imóvel." : undefined}>
            {(c) => <Select {...c} value={imovelId} onValueChange={setImovelId} options={opcoes} />}
          </Field>
        )}
      </EstadoRecurso>
      <Field label="Canal" error={tentou && !canal ? "Escolha o canal." : undefined}>
        {(c) => (
          <Select
            {...c}
            value={canal}
            onValueChange={(v) => setCanal(eCanal(v) ? v : "")}
            options={CANAIS_ANUNCIO.map((v) => ({ value: v, label: CANAL_ANUNCIO_ROTULO[v] }))}
          />
        )}
      </Field>
      {escrita.estado.fase === "erro" ? (
        <p role="alert" className="text-sm text-danger">
          {escrita.estado.mensagem}
        </p>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onFechar}>
          Cancelar
        </Button>
        <Button type="submit" loading={escrita.estado.fase === "enviando"}>
          Criar anúncio
        </Button>
      </DialogFooter>
    </form>
  );
}

function NovoAnuncio({ aberto, onAbertoChange }: { aberto: boolean; onAbertoChange: (a: boolean) => void }) {
  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent size="md">
        <FormularioNovoAnuncio onFechar={() => onAbertoChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function TelaAnuncios() {
  const url = useParametrosUrl();
  const [densidade] = usePreferencia<TableDensity>("densidade", "comfortable");
  const [novo, setNovo] = useState(false);
  const [encerrando, setEncerrando] = useState<Linha | null>(null);
  const encerramento = useEscrita();
  const { estado: andamento, executar } = useAcaoEmLinha();

  const busca = url.ler("busca") ?? "";
  const canalBruto = url.ler("canal");
  const canal = canalBruto && eCanal(canalBruto) ? canalBruto : undefined;
  const statusChave = url.lerLista("status").filter(eStatus).join(",");
  const status = useMemo(() => (statusChave ? (statusChave.split(",") as StatusAnuncio[]) : []), [statusChave]);

  const carregar = useCallback(async () => {
    const lista = await fakeApi.listAnuncios({
      busca: busca || undefined,
      canais: canal ? [canal] : undefined,
      status: status.length ? status : undefined,
    });
    return { itens: lista, total: lista.length, pagina: 1, porPagina: Math.max(lista.length, 1), totalPaginas: 1 };
  }, [busca, canal, status]);
  const { estado, recarregar } = useConsulta(carregar);
  const total = "dados" in estado && estado.dados ? estado.dados.total : undefined;

  const alternarStatus = (s: StatusAnuncio, marcado: boolean) =>
    url.definir({ status: marcado ? [...status, s] : status.filter((x) => x !== s) });

  const ativos: FiltroAtivo[] = [
    ...(canal
      ? [
          {
            id: "canal",
            rotulo: `Canal: ${CANAL_ANUNCIO_ROTULO[canal]}`,
            onRemover: () => url.definir({ canal: undefined }),
          },
        ]
      : []),
    ...status.map((s) => ({
      id: `status-${s}`,
      rotulo: `Status: ${STATUS_ANUNCIO_UI[s].rotulo}`,
      onRemover: () => alternarStatus(s, false),
    })),
  ];
  const limparFiltros = () => url.definir({ canal: undefined, status: undefined, busca: undefined });
  const temFiltro = ativos.length > 0 || busca !== "";

  const mudar = (a: Linha, para: StatusAnuncio) =>
    executar(a.id, () => fakeApi.transicionarAnuncio(a.id, para), { sucesso: SUCESSO[para] });

  const encerrar = async () => {
    if (!encerrando) return;
    const r = await encerramento.executar(() => fakeApi.transicionarAnuncio(encerrando.id, "encerrado"), {
      sucesso: SUCESSO.encerrado,
      silenciarErro: true,
    });
    if (r.fase === "ok") setEncerrando(null);
  };
  const fase = faseConfirmacaoDe(encerramento.estado);

  const colunas: DataTableColuna<Linha>[] = [
    {
      id: "imovel",
      cabecalho: "Imóvel",
      className: "min-w-48 max-w-72",
      celula: (a) =>
        a.imovel ? (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="line-clamp-2">{a.imovel.titulo}</span>
            <LinkCodigo href={rotaDoImovel(a.imovel)}>{a.imovel.codigo}</LinkCodigo>
          </div>
        ) : (
          <span className="text-text-muted">Imóvel removido</span>
        ),
    },
    {
      id: "canal",
      cabecalho: "Canal",
      celula: (a) => <span className="whitespace-nowrap">{CANAL_ANUNCIO_ROTULO[a.canal]}</span>,
    },
    {
      id: "status",
      cabecalho: "Status",
      celula: (a) => (
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_ANUNCIO_UI[a.status].tom} dot>
            {STATUS_ANUNCIO_UI[a.status].rotulo}
          </Badge>
          {a.alerta ? (
            <Badge tone="warning" icon={TriangleAlert}>
              Imóvel indisponível
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      id: "publicadoEm",
      cabecalho: "Publicado em",
      celula: (a) =>
        a.publicadoEm ? (
          <span className="tnum whitespace-nowrap">{formatData(a.publicadoEm)}</span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      id: "visualizacoes",
      cabecalho: "Visualizações",
      alinhamento: "direita",
      celula: (a) => formatNumero(a.visualizacoes),
    },
    { id: "contatos", cabecalho: "Contatos", alinhamento: "direita", celula: (a) => formatNumero(a.contatos) },
    {
      id: "acoes",
      cabecalho: <span className="sr-only">Ações</span>,
      celula: (a) => (
        <div className="flex justify-end gap-2">
          {a.transicoes.map((t) => {
            const rotulo = ROTULO_ACAO[a.status][t.para] ?? STATUS_ANUNCIO_UI[t.para].rotulo;
            const titulo = a.imovel?.codigo ?? "anúncio";
            return (
              <Button
                key={t.para}
                variant="secondary"
                size="touch"
                aria-label={`${rotulo} ${titulo} em ${CANAL_ANUNCIO_ROTULO[a.canal]}`}
                loading={enviandoLinha(andamento, a.id)}
                disabled={andamento.fase === "enviando"}
                onClick={() => (t.exigeConfirmacao ? setEncerrando(a) : void mudar(a, t.para))}
              >
                {rotulo}
              </Button>
            );
          })}
        </div>
      ),
    },
  ];

  const vazio = {
    titulo: temFiltro ? "Nenhum anúncio com esses filtros" : "Nenhum anúncio ainda",
    acao: temFiltro ? (
      <Button variant="secondary" onClick={limparFiltros}>
        Limpar filtros
      </Button>
    ) : (
      <Button size="touch" onClick={() => setNovo(true)}>
        Novo anúncio
      </Button>
    ),
  };

  const filtrosPopover = (
    <>
      <Field label="Canal">
        {(c) => (
          <Select
            {...c}
            value={canal ?? "todos"}
            onValueChange={(v) => url.definir({ canal: v === "todos" ? undefined : v })}
            options={[
              { value: "todos", label: "Todos os canais" },
              ...CANAIS_ANUNCIO.map((v) => ({ value: v, label: CANAL_ANUNCIO_ROTULO[v] })),
            ]}
          />
        )}
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-text">Status</legend>
        {STATUS_ANUNCIO.map((s) => (
          <Checkbox
            key={s}
            label={STATUS_ANUNCIO_UI[s].rotulo}
            checked={status.includes(s)}
            onCheckedChange={(m) => alternarStatus(s, m === true)}
          />
        ))}
      </fieldset>
    </>
  );

  return (
    <>
      <PageHeader
        titulo="Anúncios"
        acaoPrimaria={
          <Button size="touch" onClick={() => setNovo(true)}>
            Novo anúncio
          </Button>
        }
      />
      <div className="flex min-w-0 flex-col gap-4">
        <FilterBar
          busca={busca}
          onBuscaChange={(b) => url.definir({ busca: b })}
          debounceMs={DEBOUNCE_BUSCA_MS}
          rotuloBusca="Buscar anúncios"
          placeholderBusca="Código ou título do imóvel"
          filtros={filtrosPopover}
          ativos={ativos}
          onLimparTudo={limparFiltros}
          total={total}
          estado={estado.fase === "loading" ? "carregando" : "pronto"}
          rotuloItem={["anúncio", "anúncios"]}
        />
        <div className="min-w-0">
          <DataTable
            aria-label="Anúncios"
            colunas={colunas}
            idLinha={(a) => a.id}
            estado={estado}
            onTentarNovamente={recarregar}
            densidade={densidade}
            vazio={vazio}
          />
        </div>
      </div>

      <NovoAnuncio aberto={novo} onAbertoChange={setNovo} />
      <ConfirmDestructive
        aberto={encerrando !== null}
        onAbertoChange={(a) => {
          if (!a) {
            setEncerrando(null);
            encerramento.limpar();
          }
        }}
        titulo={encerrando?.imovel ? `Encerrar o anúncio de ${encerrando.imovel.codigo}?` : "Encerrar o anúncio?"}
        impactos={["O anúncio encerrado não muda mais.", "Dá para desfazer logo depois pelo aviso."]}
        rotuloConfirmar="Encerrar anúncio"
        rotuloVoltar="Manter anúncio"
        fase={fase}
        onConfirmar={() => void encerrar()}
      />
    </>
  );
}

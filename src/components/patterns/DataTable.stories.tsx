"use client";
import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Eye, Trash2, UserPlus } from "lucide-react";
import { proximoVencimento, statusExibicao, type Contrato, type Imovel } from "@/domain";
import { formatArea, formatData, formatMoeda } from "@/lib/format";
import { RECURSO_IDLE, type Recurso } from "@/lib/recurso";
import { BASE_HISTORIAS, HOJE_HISTORIAS, imovelPorId } from "@/mocks/data/historias";
import type { Pagina } from "@/lib/paginacao";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import type { TableDensity } from "../ui/Table";
import {
  DataTable,
  type DataTableAcaoEmLote,
  type DataTableColuna,
  type DataTableOrdenacao,
  type DataTableProps,
} from "./DataTable";
import { STATUS_CONTRATO_UI, STATUS_IMOVEL_UI, TIPO_IMOVEL_ROTULO } from "./rotulos";

const meta = { title: "Padrões/DataTable", component: DataTable } satisfies Meta<typeof DataTable>;
export default meta;
type Story = StoryObj;

/* ---------- colunas ---------- */

const colunasImoveis: DataTableColuna<Imovel>[] = [
  {
    id: "codigo",
    cabecalho: "Imóvel",
    ordenavel: true,
    fixa: "inicio",
    className: "min-w-64",
    celula: (i) => (
      <div className="flex flex-col">
        <span className="font-medium">{i.codigo}</span>
        <span className="max-w-64 truncate text-text-muted" title={i.titulo}>
          {i.titulo}
        </span>
      </div>
    ),
  },
  { id: "tipo", cabecalho: "Tipo", celula: (i) => TIPO_IMOVEL_ROTULO[i.tipo] },
  { id: "bairro", cabecalho: "Bairro", ordenavel: true, celula: (i) => i.endereco.bairro },
  { id: "area", cabecalho: "Área útil", alinhamento: "direita", celula: (i) => formatArea(i.areaUtil) },
  {
    id: "preco",
    cabecalho: "Preço",
    alinhamento: "direita",
    ordenavel: true,
    celula: (i) => formatMoeda(i.preco),
  },
  {
    id: "status",
    cabecalho: "Status",
    celula: (i) => (
      <Badge tone={STATUS_IMOVEL_UI[i.status].tom} dot>
        {STATUS_IMOVEL_UI[i.status].rotulo}
      </Badge>
    ),
  },
  {
    id: "acoes",
    cabecalho: <span className="sr-only">Ações</span>,
    fixa: "fim",
    alinhamento: "direita",
    celula: (i) => <Button variant="ghost" size="sm" icon={Eye} aria-label={`Abrir ${i.codigo}`} />,
  },
];

const colunasContratos: DataTableColuna<Contrato>[] = [
  { id: "numero", cabecalho: "Contrato", ordenavel: true, fixa: "inicio", celula: (c) => c.numero },
  {
    id: "imovel",
    cabecalho: "Imóvel",
    className: "min-w-56",
    celula: (c) => {
      const i = imovelPorId(c.imovelId);
      return (
        <span className="block max-w-64 truncate" title={i.titulo}>
          {i.codigo} · {i.titulo}
        </span>
      );
    },
  },
  {
    id: "partes",
    cabecalho: "Partes",
    className: "min-w-56",
    celula: (c) => (
      <span className="block max-w-64 truncate" title={c.partes.map((p) => p.nome).join(", ")}>
        {c.partes.map((p) => p.nome).join(", ")}
      </span>
    ),
  },
  {
    id: "valor",
    cabecalho: "Valor",
    alinhamento: "direita",
    ordenavel: true,
    celula: (c) => formatMoeda(c.valor),
  },
  {
    id: "vigencia",
    cabecalho: "Vigência",
    ordenavel: true,
    celula: (c) => `${formatData(c.inicio)} – ${formatData(c.fim)}`,
  },
  {
    id: "status",
    cabecalho: "Status",
    celula: (c) => {
      const s = STATUS_CONTRATO_UI[statusExibicao(c, HOJE_HISTORIAS)];
      return (
        <Badge tone={s.tom} dot>
          {s.rotulo}
        </Badge>
      );
    },
  },
  {
    id: "vencimento",
    cabecalho: "Próximo vencimento",
    alinhamento: "direita",
    celula: (c) => {
      const p = proximoVencimento(c);
      return p ? formatData(p.vencimento) : "—";
    },
  },
];

/* ---------- ordenação e página simuladas (fica na história, não no componente) ---------- */

type Valor = string | number;
function ordenarPor<T>(lista: T[], o: DataTableOrdenacao | null, valor: (item: T, id: string) => Valor) {
  if (!o) return lista;
  const f = o.direcao === "ascending" ? 1 : -1;
  return [...lista].sort((a, b) => {
    const va = valor(a, o.id);
    const vb = valor(b, o.id);
    return (typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb))) * f;
  });
}

const valorImovel = (i: Imovel, id: string): Valor =>
  id === "preco" ? i.preco : id === "bairro" ? i.endereco.bairro : i.codigo;
const valorContrato = (c: Contrato, id: string): Valor =>
  id === "valor" ? c.valor : id === "vigencia" ? c.inicio : c.numero;

type Fase = "dados" | "carregando" | "erro" | "recarregando";

type DemoProps<T extends object> = {
  todos: T[];
  colunas: DataTableColuna<T>[];
  idLinha: (item: T) => string;
  valor: (item: T, id: string) => Valor;
  rotulo: string;
  rotuloSelecao: (item: T) => string;
  fase?: Fase;
  porPagina?: number;
  densidade?: TableDensity;
  comSelecao?: boolean;
  acoes?: DataTableAcaoEmLote[];
  vazio?: DataTableProps<T>["vazio"];
};

function Demo<T extends object>({
  todos,
  colunas,
  idLinha,
  valor,
  rotulo,
  rotuloSelecao,
  fase = "dados",
  porPagina = 10,
  densidade,
  comSelecao,
  acoes,
  vazio,
}: DemoProps<T>) {
  const [ordenacao, setOrdenacao] = useState<DataTableOrdenacao | null>(null);
  const [pagina, setPagina] = useState(1);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const dados = useMemo<Pagina<T>>(() => {
    const ordenados = ordenarPor(todos, ordenacao, valor);
    const totalPaginas = Math.max(1, Math.ceil(ordenados.length / porPagina));
    const atual = Math.min(pagina, totalPaginas);
    return {
      itens: ordenados.slice((atual - 1) * porPagina, atual * porPagina),
      total: ordenados.length,
      pagina: atual,
      porPagina,
      totalPaginas,
    };
  }, [todos, ordenacao, valor, pagina, porPagina]);

  const estado: Recurso<Pagina<T>> =
    fase === "carregando"
      ? { fase: "loading" }
      : fase === "erro"
        ? { fase: "error", erro: new Error("Falha de rede") }
        : fase === "recarregando"
          ? { fase: "loading", dados }
          : { fase: "success", dados };

  return (
    <div className="p-4">
      <DataTable
        aria-label={rotulo}
        colunas={colunas}
        idLinha={idLinha}
        estado={estado}
        onTentarNovamente={fn()}
        densidade={densidade}
        ordenacao={ordenacao}
        onOrdenacaoChange={(o) => {
          setOrdenacao(o);
          setPagina(1);
        }}
        onPaginaChange={setPagina}
        selecionados={comSelecao ? selecionados : undefined}
        onSelecaoChange={comSelecao ? setSelecionados : undefined}
        rotuloSelecao={rotuloSelecao}
        acoesEmLote={acoes}
        vazio={vazio}
      />
    </div>
  );
}

const acoesLote: DataTableAcaoEmLote[] = [
  { id: "atribuir", rotulo: "Atribuir corretor", icone: UserPlus, permissao: { ok: true }, onExecutar: fn() },
  {
    id: "excluir",
    rotulo: "Inativar",
    icone: Trash2,
    variante: "destructive",
    permissao: { ok: false, motivo: "Somente gerentes podem inativar imóveis em lote." },
    onExecutar: fn(),
  },
];

const imoveis: Imovel[] = [...BASE_HISTORIAS.imoveis];
const contratos: Contrato[] = [...BASE_HISTORIAS.contratos];

const imoveisProps = {
  todos: imoveis,
  colunas: colunasImoveis,
  idLinha: (i: Imovel) => i.id,
  valor: valorImovel,
  rotulo: "Imóveis",
  rotuloSelecao: (i: Imovel) => `Selecionar ${i.codigo}`,
};
const contratosProps = {
  todos: contratos,
  colunas: colunasContratos,
  idLinha: (c: Contrato) => c.id,
  valor: valorContrato,
  rotulo: "Contratos",
  rotuloSelecao: (c: Contrato) => `Selecionar ${c.numero}`,
};

const textoLongo =
  "Cobertura duplex com vista panorâmica definitiva para o mar, terraço gourmet e piscina privativa ".repeat(3);
const imoveisExtremos = imoveis.slice(0, 5).map((i, n) => ({
  ...i,
  titulo: textoLongo,
  preco: n % 2 ? 99_999_999_999 : 1,
  endereco: { ...i.endereco, bairro: "Bairro de Nome Extraordinariamente Comprido do Litoral Norte" },
}));
const imoveis200 = Array.from({ length: 200 }, (_, n) => {
  const base = imoveis[n % imoveis.length]!;
  return { ...base, id: `${base.id}-x${n}`, codigo: `AT-${String(n + 1).padStart(4, "0")}` };
});
const contratosExtremos = contratos.slice(0, 5).map((c) => ({
  ...c,
  partes: c.partes.map((p) => ({ ...p, nome: `${p.nome} de Albuquerque Cavalcanti Montenegro Sobrinho Neto` })),
}));
const contratos200 = Array.from({ length: 200 }, (_, n) => {
  const base = contratos[n % contratos.length]!;
  return { ...base, id: `${base.id}-x${n}` };
});

/* ---------- imóveis ---------- */

export const ImoveisNormal: Story = { render: () => <Demo {...imoveisProps} /> };
export const ImoveisCarregando: Story = { render: () => <Demo {...imoveisProps} fase="carregando" /> };
export const ImoveisRecarregando: Story = { render: () => <Demo {...imoveisProps} fase="recarregando" /> };
export const ImoveisVazio: Story = {
  render: () => (
    <Demo
      {...imoveisProps}
      todos={[]}
      vazio={{ titulo: "Nenhum imóvel encontrado", descricao: "Ajuste os filtros ou cadastre um imóvel." }}
    />
  ),
};
export const ImoveisErro: Story = { render: () => <Demo {...imoveisProps} fase="erro" /> };
export const ImoveisDadosExtremos: Story = { render: () => <Demo {...imoveisProps} todos={imoveisExtremos} /> };
export const ImoveisUmaLinha: Story = { render: () => <Demo {...imoveisProps} todos={imoveis.slice(0, 1)} /> };
export const Imoveis200Linhas: Story = { render: () => <Demo {...imoveisProps} todos={imoveis200} porPagina={20} /> };
export const ImoveisCompacta: Story = { render: () => <Demo {...imoveisProps} densidade="compact" /> };
export const ImoveisComSelecao: Story = {
  render: () => <Demo {...imoveisProps} comSelecao acoes={acoesLote} />,
};

/* ---------- contratos (RF-40) ---------- */

export const ContratosNormal: Story = { render: () => <Demo {...contratosProps} /> };
export const ContratosCarregando: Story = { render: () => <Demo {...contratosProps} fase="carregando" /> };
export const ContratosVazio: Story = {
  render: () => (
    <Demo
      {...contratosProps}
      todos={[]}
      vazio={{ titulo: "Nenhum contrato", descricao: "Os contratos aparecem aqui." }}
    />
  ),
};
export const ContratosErro: Story = { render: () => <Demo {...contratosProps} fase="erro" /> };
export const ContratosDadosExtremos: Story = { render: () => <Demo {...contratosProps} todos={contratosExtremos} /> };
export const ContratosUmaLinha: Story = { render: () => <Demo {...contratosProps} todos={contratos.slice(0, 1)} /> };
export const Contratos200Linhas: Story = {
  render: () => <Demo {...contratosProps} todos={contratos200} porPagina={20} />,
};
export const ContratosCompacta: Story = { render: () => <Demo {...contratosProps} densidade="compact" /> };
export const ContratosComSelecao: Story = {
  render: () => <Demo {...contratosProps} comSelecao acoes={acoesLote} />,
};

export const Ociosa: Story = {
  render: () => (
    <DataTable
      aria-label="Imóveis"
      colunas={colunasImoveis}
      idLinha={(i) => i.id}
      estado={RECURSO_IDLE as Recurso<Pagina<Imovel>>}
    />
  ),
};

"use client";
import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { LayoutGrid, List } from "lucide-react";
import {
  FINALIDADES,
  TIPOS_IMOVEL,
  STATUS_IMOVEL,
  type Finalidade,
  type StatusImovel,
  type TipoImovel,
} from "@/domain";
import { formatMoeda } from "@/lib/format";
import { BASE_HISTORIAS } from "@/mocks/data/historias";
import { Field } from "../ui/Field";
import { SegmentedControl } from "../ui/SegmentedControl";
import { Select } from "../ui/Select";
import { FaixaPreco } from "../ui/Slider";
import { FilterBar, type FiltroAtivo, type FilterBarProps } from "./FilterBar";
import { FINALIDADE_ROTULO, STATUS_IMOVEL_UI, TIPO_IMOVEL_ROTULO } from "./rotulos";

const meta = { title: "Padrões/FilterBar", component: FilterBar } satisfies Meta<typeof FilterBar>;
export default meta;
type Story = StoryObj<typeof meta>;

/* ---------- exemplo completo: filtros de imóveis (RF-21) ---------- */

const TODOS = "todos";
const PRECO_MAX = 5_000_000;
type Quartos = "qualquer" | "1" | "2" | "3" | "4";

type FiltrosImoveis = {
  tipo: TipoImovel | typeof TODOS;
  finalidade: Finalidade | typeof TODOS;
  status: StatusImovel | typeof TODOS;
  bairro: string;
  preco: [number, number];
  quartos: Quartos;
};
const SEM_FILTROS: FiltrosImoveis = {
  tipo: TODOS,
  finalidade: TODOS,
  status: TODOS,
  bairro: TODOS,
  preco: [0, PRECO_MAX],
  quartos: "qualquer",
};

const bairros = [...new Set(BASE_HISTORIAS.imoveis.map((i) => i.endereco.bairro))].sort((a, b) => a.localeCompare(b));
const comTodos = (opcoes: { value: string; label: string }[], rotulo: string) => [
  { value: TODOS, label: rotulo },
  ...opcoes,
];

function FiltrosDeImoveis({ f, set }: { f: FiltrosImoveis; set: (p: Partial<FiltrosImoveis>) => void }) {
  return {
    principais: (
      <>
        <Field label="Tipo">
          <Select
            value={f.tipo}
            onValueChange={(v) => set({ tipo: v as FiltrosImoveis["tipo"] })}
            options={comTodos(
              TIPOS_IMOVEL.map((t) => ({ value: t, label: TIPO_IMOVEL_ROTULO[t] })),
              "Todos os tipos",
            )}
          />
        </Field>
        <Field label="Finalidade">
          <Select
            value={f.finalidade}
            onValueChange={(v) => set({ finalidade: v as FiltrosImoveis["finalidade"] })}
            options={comTodos(
              FINALIDADES.map((x) => ({ value: x, label: FINALIDADE_ROTULO[x] })),
              "Venda e locação",
            )}
          />
        </Field>
        <Field label="Status">
          <Select
            value={f.status}
            onValueChange={(v) => set({ status: v as FiltrosImoveis["status"] })}
            options={comTodos(
              STATUS_IMOVEL.map((s) => ({ value: s, label: STATUS_IMOVEL_UI[s].rotulo })),
              "Todos os status",
            )}
          />
        </Field>
        <Field label="Quartos">
          <SegmentedControl
            aria-label="Quartos"
            value={f.quartos}
            onValueChange={(v) => set({ quartos: v })}
            options={[
              { value: "qualquer", label: "Qualquer" },
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4+" },
            ]}
          />
        </Field>
      </>
    ),
    mais: (
      <>
        <Field label="Bairro">
          <Select
            value={f.bairro}
            onValueChange={(v) => set({ bairro: v })}
            options={comTodos(
              bairros.map((b) => ({ value: b, label: b })),
              "Todos os bairros",
            )}
          />
        </Field>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text">Faixa de preço</span>
          <FaixaPreco min={0} max={PRECO_MAX} step={50_000} value={f.preco} onValueChange={(v) => set({ preco: v })} />
        </div>
      </>
    ),
  };
}

function useFiltros() {
  const [busca, setBusca] = useState("");
  const [f, setF] = useState<FiltrosImoveis>(SEM_FILTROS);
  const set = (p: Partial<FiltrosImoveis>) => setF((a) => ({ ...a, ...p }));

  const ativos: FiltroAtivo[] = [];
  if (f.tipo !== TODOS)
    ativos.push({ id: "tipo", rotulo: TIPO_IMOVEL_ROTULO[f.tipo], onRemover: () => set({ tipo: TODOS }) });
  if (f.finalidade !== TODOS)
    ativos.push({ id: "fin", rotulo: FINALIDADE_ROTULO[f.finalidade], onRemover: () => set({ finalidade: TODOS }) });
  if (f.status !== TODOS)
    ativos.push({ id: "status", rotulo: STATUS_IMOVEL_UI[f.status].rotulo, onRemover: () => set({ status: TODOS }) });
  if (f.bairro !== TODOS) ativos.push({ id: "bairro", rotulo: f.bairro, onRemover: () => set({ bairro: TODOS }) });
  if (f.quartos !== "qualquer")
    ativos.push({
      id: "quartos",
      rotulo: f.quartos === "4" ? "4+ quartos" : `${f.quartos} quarto${f.quartos === "1" ? "" : "s"}`,
      onRemover: () => set({ quartos: "qualquer" }),
    });
  if (f.preco[0] > 0 || f.preco[1] < PRECO_MAX)
    ativos.push({
      id: "preco",
      rotulo: `${formatMoeda(f.preco[0] * 100, { semCentavos: true })} a ${formatMoeda(f.preco[1] * 100, { semCentavos: true })}`,
      onRemover: () => set({ preco: [0, PRECO_MAX] }),
    });

  // Filtro simulado só para a história: a regra real é da tela/serviço.
  const total = useMemo(
    () =>
      BASE_HISTORIAS.imoveis.filter((i) => {
        const q = f.quartos === "qualquer" ? 0 : Number(f.quartos);
        return (
          (f.tipo === TODOS || i.tipo === f.tipo) &&
          (f.finalidade === TODOS || i.finalidade === f.finalidade) &&
          (f.status === TODOS || i.status === f.status) &&
          (f.bairro === TODOS || i.endereco.bairro === f.bairro) &&
          (f.quartos === "qualquer" || (f.quartos === "4" ? i.quartos >= 4 : i.quartos === q)) &&
          i.preco / 100 >= f.preco[0] &&
          i.preco / 100 <= f.preco[1] &&
          (busca === "" || `${i.codigo} ${i.titulo}`.toLowerCase().includes(busca.toLowerCase()))
        );
      }).length,
    [f, busca],
  );

  const filtros = FiltrosDeImoveis({ f, set });
  return {
    busca,
    onBuscaChange: setBusca,
    filtros: filtros.principais,
    maisFiltros: filtros.mais,
    ativos,
    onLimparTudo: () => {
      setF(SEM_FILTROS);
      setBusca("");
    },
    total,
  } satisfies Partial<FilterBarProps>;
}

function Exemplo({ estado, comOrdenacao = true }: { estado?: FilterBarProps["estado"]; comOrdenacao?: boolean }) {
  const props = useFiltros();
  const [ordem, setOrdem] = useState("recentes");
  const [vista, setVista] = useState<"grade" | "lista">("grade");
  return (
    <div className="p-4">
      <FilterBar
        {...props}
        estado={estado}
        rotuloItem={["imóvel", "imóveis"]}
        placeholderBusca="Buscar por código ou título"
        ordenacao={
          comOrdenacao ? (
            <Select
              aria-label="Ordenar por"
              value={ordem}
              onValueChange={setOrdem}
              options={[
                { value: "recentes", label: "Mais recentes" },
                { value: "preco-asc", label: "Menor preço" },
                { value: "preco-desc", label: "Maior preço" },
              ]}
            />
          ) : undefined
        }
        visualizacao={
          <SegmentedControl
            aria-label="Visualização"
            value={vista}
            onValueChange={setVista}
            options={[
              { value: "grade", label: "Grade", icon: LayoutGrid, hideLabel: true },
              { value: "lista", label: "Lista", icon: List, hideLabel: true },
            ]}
          />
        }
      />
    </div>
  );
}

export const Normal: Story = {
  args: { busca: "", onBuscaChange: fn() },
  render: () => <Exemplo />,
};

export const ComFiltrosAtivos: Story = {
  args: { busca: "", onBuscaChange: fn() },
  render: () => <Exemplo />,
  play: async ({ canvasElement }) => {
    const tela = within(canvasElement.ownerDocument.body);
    await userEvent.click(tela.getByRole("button", { name: "Filtros" }));
    await userEvent.click(await tela.findByRole("combobox", { name: "Tipo" }));
    await userEvent.click(await tela.findByRole("option", { name: "Casa" }));
    await expect(tela.getByRole("button", { name: "Remover filtro: Casa" })).toBeInTheDocument();
  },
};

export const Carregando: Story = {
  args: { busca: "casa", onBuscaChange: fn() },
  render: () => <Exemplo estado="carregando" />,
};

export const SemResultados: Story = {
  args: {
    busca: "xyz",
    onBuscaChange: fn(),
    total: 0,
    ativos: [{ id: "tipo", rotulo: "Cobertura", onRemover: fn() }],
    onLimparTudo: fn(),
    filtros: <p className="text-sm text-text-muted">Filtros da tela.</p>,
  },
};

/** Falha na busca: a tela mostra o ErrorState na lista; a barra apenas não anuncia total. */
export const SemTotal: Story = {
  args: { busca: "", onBuscaChange: fn(), filtros: <p className="text-sm">Filtros da tela.</p> },
};

export const DadosExtremos: Story = {
  args: {
    busca: "um texto de busca muito longo que não cabe no campo de busca em telas pequenas, para testar o corte",
    onBuscaChange: fn(),
    total: 1234567,
    rotuloItem: ["imóvel", "imóveis"],
    filtros: <p className="text-sm">Filtros da tela.</p>,
    ativos: Array.from({ length: 12 }, (_, n) => ({
      id: String(n),
      rotulo: n % 3 === 0 ? "Bairro com nome extraordinariamente comprido do litoral norte" : `Filtro ${n + 1}`,
      onRemover: fn(),
    })),
    onLimparTudo: fn(),
  },
};

export const Mobile: Story = {
  args: { busca: "", onBuscaChange: fn() },
  render: () => <Exemplo />,
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

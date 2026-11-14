"use client";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { formatMoeda } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type SortDirection,
} from "./Table";
import { Skeleton } from "./Skeleton";

const meta = { title: "Átomos/Table", component: Table, args: { "aria-label": "Contratos" } } satisfies Meta<
  typeof Table
>;
export default meta;
type Story = StoryObj<typeof meta>;

const contratos = [
  {
    id: "2024/0181",
    imovel: "Apto 302 — Rua das Acácias, 450",
    cliente: "Mariana Souza",
    aluguel: 320000,
    status: "Ativo",
  },
  {
    id: "2024/0182",
    imovel: "Casa — Alameda dos Ipês, 88",
    cliente: "Rafael Tavares",
    aluguel: 485000,
    status: "Ativo",
  },
  {
    id: "2024/0183",
    imovel: "Sala comercial 12 — Av. Central, 1020",
    cliente: "Beatriz Almeida",
    aluguel: 210000,
    status: "Em renovação",
  },
  {
    id: "2024/0184",
    imovel: "Kitnet 05 — Rua do Comércio, 17",
    cliente: "Carlos Menezes",
    aluguel: 98000,
    status: "Ativo",
  },
  {
    id: "2024/0185",
    imovel: "Cobertura Duplex — Parque das Palmeiras, Bloco B, 1201",
    cliente: "Associação dos Moradores do Condomínio Residencial Vista Alegre Ltda.",
    aluguel: 1250000,
    status: "Ativo",
  },
  {
    id: "2024/0186",
    imovel: "Apto 71 — Rua Verde, 230",
    cliente: "Fernanda Lopes",
    aluguel: 275000,
    status: "Encerrado",
  },
  {
    id: "2024/0187",
    imovel: "Galpão 3 — Distrito Industrial",
    cliente: "Logística Norte S.A.",
    aluguel: 890000,
    status: "Ativo",
  },
  {
    id: "2024/0188",
    imovel: "Casa — Rua das Flores, 9",
    cliente: "Paulo Henrique Dias",
    aluguel: 360000,
    status: "Inadimplente",
  },
];

type Chave = "id" | "aluguel";

function Contratos({ density, selected }: { density?: "comfortable" | "compact"; selected?: string }) {
  const [sort, setSort] = useState<{ key: Chave; dir: SortDirection }>({ key: "id", dir: "ascending" });
  const linhas = [...contratos].sort((a, b) => {
    const r = sort.key === "aluguel" ? a.aluguel - b.aluguel : a.id.localeCompare(b.id);
    return sort.dir === "descending" ? -r : r;
  });
  const head = (
    key: Chave,
  ): { sortDirection: SortDirection; onSortChange: (d: "ascending" | "descending") => void } => ({
    sortDirection: sort.key === key ? sort.dir : "none",
    onSortChange: (dir) => setSort({ key, dir }),
  });
  return (
    <div className="p-6">
      <Table aria-label="Contratos de locação" density={density}>
        <TableCaption>8 contratos de locação</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead sortable {...head("id")}>
              Contrato
            </TableHead>
            <TableHead>Imóvel</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead sortable align="right" {...head("aluguel")}>
              Aluguel
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((c) => (
            <TableRow key={c.id} data-state={c.id === selected ? "selected" : undefined}>
              <TableCell className="tnum">{c.id}</TableCell>
              <TableCell>{c.imovel}</TableCell>
              <TableCell>{c.cliente}</TableCell>
              <TableCell>{c.status}</TableCell>
              <TableCell align="right">{formatMoeda(c.aluguel)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const Contratos8: Story = { name: "Contratos (ordenável)", render: () => <Contratos /> };
export const LinhaSelecionada: Story = { name: "Linha selecionada", render: () => <Contratos selected="2024/0183" /> };
export const Compacta: Story = { render: () => <Contratos density="compact" selected="2024/0184" /> };

export const SemResultados: Story = {
  name: "Corpo vazio",
  render: () => (
    <div className="p-6">
      <Table aria-label="Contratos de locação">
        <TableHeader>
          <TableRow>
            <TableHead>Contrato</TableHead>
            <TableHead>Imóvel</TableHead>
            <TableHead align="right">Aluguel</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={3} className="text-center text-text-muted">
              Nenhum contrato encontrado para os filtros aplicados.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};

export const Carregando: Story = {
  render: () => (
    <div className="p-6">
      <Table aria-label="Contratos de locação" aria-busy="true">
        <TableCaption>Carregando contratos…</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Contrato</TableHead>
            <TableHead>Imóvel</TableHead>
            <TableHead align="right">Aluguel</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }, (_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="w-64" />
              </TableCell>
              <TableCell align="right">
                <Skeleton className="ml-auto w-24" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

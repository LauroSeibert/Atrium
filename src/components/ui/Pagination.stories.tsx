"use client";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Pagination } from "./Pagination";

const meta = { title: "Átomos/Pagination", component: Pagination, args: { page: 1, pageCount: 4 } } satisfies Meta<
  typeof Pagination
>;
export default meta;
type Story = StoryObj<typeof meta>;

function Controlada({ total, pageSize, initial = 1 }: { total: number; pageSize: number; initial?: number }) {
  const [page, setPage] = useState(initial);
  return (
    <div className="p-6">
      <Pagination
        page={page}
        pageCount={Math.ceil(total / pageSize)}
        onPageChange={setPage}
        pageSize={pageSize}
        total={total}
      />
    </div>
  );
}

export const PoucasPaginas: Story = {
  name: "Poucas páginas (1–12 de 48)",
  render: () => <Controlada total={48} pageSize={12} />,
};
export const MuitasPaginas: Story = {
  name: "Muitas páginas (reticências)",
  render: () => <Controlada total={1240} pageSize={12} initial={50} />,
};
export const UltimaPagina: Story = {
  name: "Última página",
  render: () => <Controlada total={48} pageSize={12} initial={4} />,
};

export const ComoLinks: Story = {
  name: "Como links (hrefBuilder)",
  render: () => (
    <div className="p-6">
      <Pagination page={2} pageCount={9} hrefBuilder={(p) => `/leads?pagina=${p}`} pageSize={20} total={168} />
    </div>
  ),
};

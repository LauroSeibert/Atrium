import type { Metadata } from "next";
import { TelaContrato } from "@/features/contratos/TelaContrato";

export const metadata: Metadata = { title: "Contrato" };

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TelaContrato id={decodeURIComponent(id)} />;
}

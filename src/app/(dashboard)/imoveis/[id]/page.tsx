import type { Metadata } from "next";
import { TelaImovel } from "@/features/imoveis/TelaImovel";

export const metadata: Metadata = { title: "Imóvel" };

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TelaImovel id={decodeURIComponent(id)} />;
}

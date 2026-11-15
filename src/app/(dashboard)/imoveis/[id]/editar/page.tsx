import type { Metadata } from "next";
import { TelaFormImovel } from "@/features/imoveis/TelaFormImovel";

export const metadata: Metadata = { title: "Editar imóvel" };

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TelaFormImovel id={decodeURIComponent(id)} />;
}

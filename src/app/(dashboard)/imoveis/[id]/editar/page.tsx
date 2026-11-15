import type { Metadata } from "next";
import { TelaEmConstrucao } from "@/features/shell/TelaEmConstrucao";

export const metadata: Metadata = { title: "Editar imóvel" };

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rotulo = decodeURIComponent(id);
  return <TelaEmConstrucao titulo={`Editar imóvel ${rotulo}`} requisitos="RF-27" rotuloTrilha={rotulo} />;
}

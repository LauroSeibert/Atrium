import type { Metadata } from "next";
import { TelaEmConstrucao } from "@/features/shell/TelaEmConstrucao";

export const metadata: Metadata = { title: "Lead" };

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rotulo = decodeURIComponent(id);
  return <TelaEmConstrucao titulo={`Lead ${rotulo}`} requisitos="RF-33, RF-34, RF-37" rotuloTrilha={rotulo} />;
}

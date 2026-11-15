import type { Metadata } from "next";
import { TelaEmConstrucao } from "@/features/shell/TelaEmConstrucao";

export const metadata: Metadata = { title: "Contrato" };

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rotulo = decodeURIComponent(id);
  return (
    <TelaEmConstrucao titulo={`Contrato ${rotulo}`} requisitos="RF-42, RF-43, RF-46, RF-48" rotuloTrilha={rotulo} />
  );
}

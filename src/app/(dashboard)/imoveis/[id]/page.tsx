import type { Metadata } from "next";
import { Pencil } from "lucide-react";
import { AcaoLink } from "@/features/shell/AcaoLink";
import { TelaEmConstrucao } from "@/features/shell/TelaEmConstrucao";

export const metadata: Metadata = { title: "Imóvel" };

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rotulo = decodeURIComponent(id);
  return (
    <TelaEmConstrucao
      titulo={`Imóvel ${rotulo}`}
      requisitos="RF-24…26, RF-29, RF-65"
      acaoPrimaria={
        <AcaoLink href={`/imoveis/${id}/editar`} icone={Pencil}>
          Editar imóvel
        </AcaoLink>
      }
      rotuloTrilha={rotulo}
    />
  );
}

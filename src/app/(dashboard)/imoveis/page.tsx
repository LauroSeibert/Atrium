import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { AcaoLink } from "@/features/shell/AcaoLink";
import { TelaEmConstrucao } from "@/features/shell/TelaEmConstrucao";

export const metadata: Metadata = { title: "Imóveis" };

export default function Pagina() {
  return (
    <TelaEmConstrucao
      titulo="Imóveis"
      requisitos="RF-20…23, RF-28, RF-49"
      acaoPrimaria={
        <AcaoLink href="/imoveis/novo" icone={Plus}>
          Novo imóvel
        </AcaoLink>
      }
    />
  );
}

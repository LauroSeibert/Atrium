import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import { AcaoLink } from "@/features/shell/AcaoLink";
import { TelaEmConstrucao } from "@/features/shell/TelaEmConstrucao";

export const metadata: Metadata = { title: "Leads" };

export default function Pagina() {
  return (
    <TelaEmConstrucao
      titulo="Leads"
      requisitos="RF-30…32, RF-35, RF-36, RF-38, RF-39"
      acaoPrimaria={
        <AcaoLink href="/leads?novo=1" icone={UserPlus}>
          Novo lead
        </AcaoLink>
      }
    />
  );
}

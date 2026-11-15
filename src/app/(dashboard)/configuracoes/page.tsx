import type { Metadata } from "next";
import { TelaEmConstrucao } from "@/features/shell/TelaEmConstrucao";

export const metadata: Metadata = { title: "Configurações" };

export default function Pagina() {
  return <TelaEmConstrucao titulo="Configurações" requisitos="RF-03, RF-08, RF-09, RF-50, RF-51" />;
}

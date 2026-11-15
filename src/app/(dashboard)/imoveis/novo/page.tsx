import type { Metadata } from "next";
import { TelaEmConstrucao } from "@/features/shell/TelaEmConstrucao";

export const metadata: Metadata = { title: "Novo imóvel" };

export default function Pagina() {
  return <TelaEmConstrucao titulo="Novo imóvel" requisitos="RF-27" />;
}

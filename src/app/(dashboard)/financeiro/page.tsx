import type { Metadata } from "next";
import { TelaEmConstrucao } from "@/features/shell/TelaEmConstrucao";

export const metadata: Metadata = { title: "Financeiro" };

export default function Pagina() {
  return <TelaEmConstrucao titulo="Financeiro" requisitos="RF-44, RF-45" />;
}

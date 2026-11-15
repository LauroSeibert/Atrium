import type { Metadata } from "next";
import { TelaEmConstrucao } from "@/features/shell/TelaEmConstrucao";

export const metadata: Metadata = { title: "Contratos" };

export default function Pagina() {
  return <TelaEmConstrucao titulo="Contratos" requisitos="RF-40, RF-41, RF-47, RF-49" />;
}

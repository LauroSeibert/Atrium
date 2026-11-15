import type { Metadata } from "next";
import { TelaEmConstrucao } from "@/features/shell/TelaEmConstrucao";

export const metadata: Metadata = { title: "Dashboard" };

export default function Pagina() {
  return <TelaEmConstrucao titulo="Dashboard" requisitos="RF-10…16" />;
}

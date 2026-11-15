import type { Metadata } from "next";
import { TelaConfiguracoes } from "@/features/configuracoes/TelaConfiguracoes";

export const metadata: Metadata = { title: "Configurações" };

export default function Pagina() {
  return <TelaConfiguracoes />;
}

import type { Metadata } from "next";
import { TelaFormImovel } from "@/features/imoveis/TelaFormImovel";

export const metadata: Metadata = { title: "Novo imóvel" };

export default function Pagina() {
  return <TelaFormImovel />;
}

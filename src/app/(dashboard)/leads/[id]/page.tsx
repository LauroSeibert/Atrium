import type { Metadata } from "next";
import { TelaLead } from "@/features/leads/TelaLead";

export const metadata: Metadata = { title: "Lead" };

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TelaLead id={decodeURIComponent(id)} modo="pagina" />;
}

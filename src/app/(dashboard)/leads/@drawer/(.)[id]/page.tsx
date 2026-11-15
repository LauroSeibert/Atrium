import { LeadDrawer } from "@/features/leads/LeadDrawer";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LeadDrawer id={decodeURIComponent(id)} />;
}

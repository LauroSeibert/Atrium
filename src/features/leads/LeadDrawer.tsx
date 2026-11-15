"use client";
/** Detalhe do lead em drawer sobre o quadro (rota interceptada, RF-33). Fechar = voltar no histórico. */
import { useRouter } from "next/navigation";
import { Drawer, DrawerContent } from "@/components/ui/Drawer";
import { TelaLead } from "./TelaLead";

export function LeadDrawer({ id }: { id: string }) {
  const router = useRouter();
  return (
    <Drawer open onOpenChange={(aberto) => !aberto && router.back()}>
      <DrawerContent size="lg">
        <TelaLead id={id} modo="drawer" />
      </DrawerContent>
    </Drawer>
  );
}

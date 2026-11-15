import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/** Ação primária que navega (botão primário sobre `next/link`; `asChild` não desenha ícones, então vão aqui). */
export function AcaoLink({ href, icone, children }: { href: string; icone?: LucideIcon; children: string }) {
  return (
    <Button asChild size="md" className="max-md:h-11 max-md:text-base">
      <Link href={href}>
        {icone ? <Icon icon={icone} size={16} /> : null}
        {children}
      </Link>
    </Button>
  );
}

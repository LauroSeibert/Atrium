import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Typography";
import { cn } from "@/lib/cn";

/** Card de seção do painel (título `h2` + conteúdo), com o mesmo respiro dos cards de gráfico. */
export function CartaoSecao({
  titulo,
  children,
  className,
}: {
  titulo: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex min-w-0 flex-col gap-4 p-4 sm:p-6", className)}>
      <Heading level={2} size="lg" className="break-words">
        {titulo}
      </Heading>
      {children}
    </Card>
  );
}

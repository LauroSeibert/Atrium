import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export type EmptyProps = Omit<ComponentProps<"div">, "title"> & {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  /** Ação principal (ex.: `<Button>`). */
  action?: ReactNode;
  /** Nível do título (2 a 6) para respeitar a hierarquia da página. Padrão: 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
};

/** Base de estado vazio: ícone, título, descrição e ação, centralizados. */
export function Empty({ icon, title, description, action, headingLevel = 3, className, ...props }: EmptyProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-12 text-center", className)} {...props}>
      {icon ? (
        <span className="flex size-12 items-center justify-center rounded-full bg-surface-warm text-text">
          <Icon icon={icon} size={24} />
        </span>
      ) : null}
      <Heading className="text-lg font-semibold text-text">{title}</Heading>
      {description ? <p className="max-w-md text-sm text-text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

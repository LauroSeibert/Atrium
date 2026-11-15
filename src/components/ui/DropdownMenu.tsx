import { DropdownMenu as MenuPrimitive } from "radix-ui";
import { Check, ChevronRight, Circle, type LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;
export const DropdownMenuGroup = MenuPrimitive.Group;
export const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup;
export const DropdownMenuSub = MenuPrimitive.Sub;

const panel =
  "z-(--z-popover) min-w-48 rounded-lg border border-border bg-surface-raised p-1 text-sm text-text shadow-2";
const item =
  "relative flex h-9 cursor-pointer items-center gap-2 rounded-sm px-2 outline-none select-none data-[highlighted]:bg-bg-subtle data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(panel, "data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in", className)}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

export type DropdownMenuItemProps = ComponentProps<typeof MenuPrimitive.Item> & {
  icon?: LucideIcon;
  tone?: "default" | "destructive";
};

export function DropdownMenuItem({ className, icon, tone = "default", children, ...props }: DropdownMenuItemProps) {
  return (
    <MenuPrimitive.Item
      className={cn(item, tone === "destructive" && "text-danger data-[highlighted]:bg-danger-bg", className)}
      {...props}
    >
      {/* Com `asChild` o Slot exige um único filho: o ícone vai dentro do próprio filho. */}
      {props.asChild ? (
        children
      ) : (
        <>
          {icon ? <Icon icon={icon} size={16} /> : null}
          {children}
        </>
      )}
    </MenuPrimitive.Item>
  );
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: ComponentProps<typeof MenuPrimitive.CheckboxItem>) {
  return (
    <MenuPrimitive.CheckboxItem className={cn(item, "pl-8", className)} {...props}>
      <span className="absolute left-2 inline-flex size-4 items-center justify-center">
        <MenuPrimitive.ItemIndicator>
          <Icon icon={Check} size={16} />
        </MenuPrimitive.ItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof MenuPrimitive.RadioItem>) {
  return (
    <MenuPrimitive.RadioItem className={cn(item, "pl-8", className)} {...props}>
      <span className="absolute left-2 inline-flex size-4 items-center justify-center">
        <MenuPrimitive.ItemIndicator>
          <Icon icon={Circle} size={16} className="size-2 fill-current" />
        </MenuPrimitive.ItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof MenuPrimitive.Label>) {
  return <MenuPrimitive.Label className={cn("px-2 py-1 text-xs font-medium text-text-muted", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

export function DropdownMenuSubTrigger({
  className,
  icon,
  children,
  ...props
}: ComponentProps<typeof MenuPrimitive.SubTrigger> & { icon?: LucideIcon }) {
  return (
    <MenuPrimitive.SubTrigger className={cn(item, "data-[state=open]:bg-bg-subtle", className)} {...props}>
      {icon ? <Icon icon={icon} size={16} /> : null}
      {children}
      <Icon icon={ChevronRight} size={16} className="ml-auto" />
    </MenuPrimitive.SubTrigger>
  );
}

export function DropdownMenuSubContent({ className, ...props }: ComponentProps<typeof MenuPrimitive.SubContent>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.SubContent
        className={cn(panel, "data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in", className)}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
}

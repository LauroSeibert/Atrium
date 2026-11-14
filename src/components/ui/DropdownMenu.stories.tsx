import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Copy, Ellipsis, ExternalLink, Pencil, Trash2, UserRoundCheck } from "lucide-react";
import { Button } from "./Button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./DropdownMenu";

const meta = { title: "Átomos/DropdownMenu", component: DropdownMenu } satisfies Meta<typeof DropdownMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AcoesDoImovel: Story = {
  name: "Ações do imóvel",
  render: () => (
    <div className="h-80 p-8">
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" icon={Ellipsis} aria-label="Mais ações" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Apto 52, Ed. Solar das Palmeiras</DropdownMenuLabel>
          <DropdownMenuItem icon={ExternalLink}>Abrir detalhes</DropdownMenuItem>
          <DropdownMenuItem icon={Pencil} shortcut="E">
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem icon={Copy} disabled>
            Duplicar (indisponível)
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger icon={UserRoundCheck}>Atribuir corretor</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Carla Menezes</DropdownMenuItem>
              <DropdownMenuItem>Rafael Tavares</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem icon={Trash2} tone="destructive" shortcut="Del">
            Excluir imóvel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
};

function Selecoes() {
  const [colunas, setColunas] = useState({ endereco: true, valor: true, corretor: false });
  const [ordem, setOrdem] = useState("recentes");
  return (
    <div className="h-96 p-8">
      <DropdownMenu defaultOpen modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">Exibição</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Colunas</DropdownMenuLabel>
          {(["endereco", "valor", "corretor"] as const).map((chave) => (
            <DropdownMenuCheckboxItem
              key={chave}
              checked={colunas[chave]}
              onCheckedChange={(v) => setColunas((c) => ({ ...c, [chave]: v === true }))}
            >
              {{ endereco: "Endereço", valor: "Valor", corretor: "Corretor responsável" }[chave]}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={ordem} onValueChange={setOrdem}>
            <DropdownMenuRadioItem value="recentes">Mais recentes</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="valor">Maior valor</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const CheckboxERadio: Story = { name: "Checkbox e radio", render: () => <Selecoes /> };

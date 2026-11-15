import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AVATAR_VARIANTES, AvatarIlustrado, AvatarIniciais } from "./SvgAvatar";

const meta = {
  title: "Ilustrações/Avatares",
  component: AvatarIlustrado,
  args: { variante: 1, titulo: "Carla Mendes" },
  argTypes: { variante: { control: "select", options: AVATAR_VARIANTES } },
} satisfies Meta<typeof AvatarIlustrado>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  name: "Padrão",
  render: (args) => (
    <div className="size-24">
      <AvatarIlustrado {...args} />
    </div>
  ),
};

const TAMANHOS = [
  { classe: "size-8", rotulo: "32" },
  { classe: "size-12", rotulo: "48" },
  { classe: "size-16", rotulo: "64" },
] as const;

const NOMES = ["Carla Mendes", "Beatriz Lima", "Rafaela Duarte", "Henrique Alves", "Marina Costa", "Tiago Nunes"];

function Linha({ legenda, children }: { legenda: string; children: (classe: string) => React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-end gap-3">
        {TAMANHOS.map((t) => (
          <div key={t.classe} className={t.classe}>
            {children(t.classe)}
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm text-text-muted">{legenda}</p>
    </div>
  );
}

export const Todos: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {AVATAR_VARIANTES.map((v) => (
        <Linha key={v} legenda={`Ilustrado ${v}`}>
          {() => <AvatarIlustrado variante={v} titulo={NOMES[v - 1]} />}
        </Linha>
      ))}
      <Linha legenda="Iniciais, beige">{() => <AvatarIniciais nome="Ana Beatriz Souza" tom="beige" />}</Linha>
      <Linha legenda="Iniciais, verde">{() => <AvatarIniciais nome="Ana Beatriz Souza" tom="verde" />}</Linha>
    </div>
  ),
};

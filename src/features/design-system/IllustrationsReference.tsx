import type { ReactNode } from "react";
import { AvatarIlustrado, AvatarIniciais, AVATAR_VARIANTES } from "@/assets/svg/avatares/SvgAvatar";
import { FACHADA_VARIANTES, SvgFachada } from "@/assets/svg/casas/SvgFachada";
import { COMODO_VARIANTES, SvgComodo } from "@/assets/svg/comodos/SvgComodo";
import { SvgVazio, VAZIO_VARIANTES } from "@/assets/svg/vazios/SvgVazio";
import { AtriumLogo } from "@/components/brand/AtriumLogo";
import { PropertyImage } from "@/components/patterns/PropertyImage";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { TipoImovel } from "@/domain/imovel/schema";

const PALETA = [
  { token: "illus-sky", classe: "bg-illus-sky", uso: "Céu e fundo" },
  { token: "illus-ground", classe: "bg-illus-ground", uso: "Chão" },
  { token: "illus-wall", classe: "bg-illus-wall", uso: "Paredes" },
  { token: "illus-wall-alt", classe: "bg-illus-wall-alt", uso: "Paredes secundárias" },
  { token: "illus-roof", classe: "bg-illus-roof", uso: "Telhado" },
  { token: "illus-detail", classe: "bg-illus-detail", uso: "Portas e janelas" },
  { token: "illus-ink", classe: "bg-illus-ink", uso: "Contornos e puxadores" },
  { token: "illus-accent", classe: "bg-illus-accent", uso: "Sol e destaques" },
] as const;

const TIPOS: { tipo: TipoImovel; rotulo: string }[] = [
  { tipo: "casa", rotulo: "Casa" },
  { tipo: "apartamento", rotulo: "Apartamento" },
  { tipo: "cobertura", rotulo: "Cobertura" },
  { tipo: "terreno", rotulo: "Terreno" },
  { tipo: "comercial", rotulo: "Comercial" },
];

const TAMANHOS = [
  { rotulo: "32 px", classe: "size-8", nome: "Marina Souza" },
  { rotulo: "48 px", classe: "size-12", nome: "Rafael Lima" },
  { rotulo: "64 px", classe: "size-16", nome: "Camila Torres" },
] as const;

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {description ? <p className="max-w-prose text-text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Card({ rotulo, componente, children }: { rotulo: string; componente: string; children: ReactNode }) {
  return (
    <figure className="m-0 flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-surface p-3">
      {children}
      <figcaption className="flex flex-col">
        <span className="text-sm font-medium">{rotulo}</span>
        <span className="text-xs break-words text-text-muted">{componente}</span>
      </figcaption>
    </figure>
  );
}

const grade = "grid gap-4 sm:grid-cols-2 lg:grid-cols-4";

function Fachadas() {
  return (
    <div className={grade}>
      {FACHADA_VARIANTES.map(({ variante, rotulo }) => (
        <Card key={variante} rotulo={rotulo} componente={`SvgFachada · ${variante}`}>
          <div className="aspect-4/3 overflow-hidden rounded-md">
            <SvgFachada variant={variante} />
          </div>
        </Card>
      ))}
    </div>
  );
}

/** Referência visual da biblioteca de ilustrações (Fase 5). Usada pela rota /design-system/illustrations. */
export function IllustrationsReference() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 sm:px-8 sm:py-12">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-4">
          <AtriumLogo className="self-start" />
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">Design system</p>
            <h1 className="text-3xl font-semibold tracking-tight">Ilustrações</h1>
            <p className="max-w-prose text-base text-text-muted">
              Toda ilustração usa só a paleta semântica <code>--illus-*</code>, que muda com o tema, e segue a proporção
              4:3 (cenas) ou 1:1 (avatares). Cada SVG expõe <code>role=&quot;img&quot;</code> com{" "}
              <code>&lt;title&gt;</code> como nome acessível, ou fica oculto quando é decorativo.
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <Section id="fachadas" title="Fachadas" description="Uma por tipo de imóvel, mais variações de estilo.">
        <Fachadas />
      </Section>

      <Section id="comodos" title="Cômodos">
        <div className={grade}>
          {COMODO_VARIANTES.map(({ variante, rotulo }) => (
            <Card key={variante} rotulo={rotulo} componente={`SvgComodo · ${variante}`}>
              <div className="aspect-4/3 overflow-hidden rounded-md">
                <SvgComodo variant={variante} />
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="vazios" title="Estados vazios">
        <div className={grade}>
          {VAZIO_VARIANTES.map(({ variant, rotulo }) => (
            <Card key={variant} rotulo={rotulo} componente={`SvgVazio · ${variant}`}>
              <div className="aspect-4/3 overflow-hidden rounded-md">
                <SvgVazio variant={variant} />
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="avatares" title="Avatares" description="Seis ilustrados e iniciais em dois tons, em três tamanhos.">
        <h3 className="text-base font-semibold">Ilustrados</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {AVATAR_VARIANTES.map((v) => (
            <Card key={v} rotulo={`Avatar ${v}`} componente={`AvatarIlustrado · variante ${v}`}>
              <div className="size-16">
                <AvatarIlustrado variante={v} titulo={`Avatar ilustrado ${v}`} />
              </div>
            </Card>
          ))}
        </div>
        <h3 className="text-base font-semibold">Iniciais</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["beige", "verde"] as const).map((tom) => (
            <Card key={tom} rotulo={`Tom ${tom}`} componente={`AvatarIniciais · tom ${tom}`}>
              <div className="flex flex-wrap items-end gap-4">
                {TAMANHOS.map((t) => (
                  <div key={t.rotulo} className="flex flex-col items-center gap-1">
                    <div className={t.classe}>
                      <AvatarIniciais nome={t.nome} tom={tom} />
                    </div>
                    <span className="text-xs text-text-muted">{t.rotulo}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        id="property-image"
        title="PropertyImage"
        description="Escolhe a ilustração pelo imóvel; sem ilustração, mostra o fallback."
      >
        <div className={grade}>
          {TIPOS.map(({ tipo, rotulo }) => (
            <Card key={tipo} rotulo={rotulo} componente={`PropertyImage · tipo ${tipo}`}>
              <PropertyImage tipo={tipo} titulo={`Imagem de ${rotulo.toLowerCase()}`} />
            </Card>
          ))}
          <Card rotulo="Com cômodo" componente="PropertyImage · comodo cozinha">
            <PropertyImage tipo="apartamento" comodo="cozinha" titulo="Imagem da cozinha" />
          </Card>
          <Card rotulo="Sem ilustração" componente="PropertyImage · fachada null">
            <PropertyImage tipo="casa" fachada={null} />
          </Card>
        </div>
      </Section>

      <Section
        id="lado-a-lado"
        title="Claro × escuro lado a lado"
        description="Os dois temas ao mesmo tempo, independentemente do tema da página."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {(["light", "dark"] as const).map((tema) => (
            <div
              key={tema}
              className={`${tema} flex flex-col gap-3 rounded-lg border border-border bg-bg p-3 text-text`}
            >
              <h3 className="text-base font-semibold">{tema === "light" ? "Tema claro" : "Tema escuro"}</h3>
              <div className="grid grid-cols-2 gap-3">
                {FACHADA_VARIANTES.map(({ variante, rotulo }) => (
                  <div key={variante} className="aspect-4/3 overflow-hidden rounded-md">
                    <SvgFachada variant={variante} titulo={`${rotulo} (${tema === "light" ? "claro" : "escuro"})`} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="paleta" title="Paleta" description="Oito tokens semânticos com valores próprios em cada tema.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {PALETA.map((c) => (
            <div key={c.token} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
              <div className={`${c.classe} h-12 rounded-md border border-border`} aria-hidden="true" />
              <div className="flex flex-col">
                <code className="text-sm break-words">--{c.token}</code>
                <span className="text-xs text-text-muted">{c.uso}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

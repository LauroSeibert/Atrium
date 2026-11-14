import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import storybook from "eslint-plugin-storybook";

/**
 * Regras do design system (RNF-10): nada de cor, espaço, raio ou duração fora dos tokens.
 * Complementa `npm run check:hex`, que também cobre CSS/SVG/JSON.
 */
const COR_LITERAL = String.raw`/(^|[^&\w])#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|\b(rgba?|hsla?|oklch|oklab|hwb|lab|lch|color-mix)\(/i`;
// Valores arbitrários do Tailwind (p-[13px], bg-[#fff], duration-[250ms]…) e durações/raios fora da escala.
const TW_ARBITRARIO = String.raw`/(^|\s|:)-?[a-z][\w-]*-\[[^\]]+\]/`;
const TW_DURACAO_LITERAL = String.raw`/(^|\s|:)(duration|delay)-\d/`;

const designSystemRules = {
  "no-restricted-syntax": [
    "error",
    { selector: `Literal[value=${COR_LITERAL}]`, message: "Cor literal: use um token (var(--…) ou classe do tema)." },
    {
      selector: `TemplateElement[value.raw=${COR_LITERAL}]`,
      message: "Cor literal: use um token (var(--…) ou classe do tema).",
    },
    {
      selector: `Literal[value=${TW_ARBITRARIO}]`,
      message: "Valor arbitrário do Tailwind: use a escala de tokens (ou crie o token).",
    },
    {
      selector: `TemplateElement[value.raw=${TW_ARBITRARIO}]`,
      message: "Valor arbitrário do Tailwind: use a escala de tokens (ou crie o token).",
    },
    {
      selector: `Literal[value=${TW_DURACAO_LITERAL}]`,
      message: "Duração literal: use duration-(--dur-fast|base|slow|page).",
    },
  ],
};

/**
 * Fluxos críticos (docs/ESTADOS-E-FLUXOS.md, RNF-20): fora de src/domain, ninguém atribui
 * status/etapa/pagoEm diretamente — sempre pela função de transição do domínio.
 */
const fluxoCriticoRules = {
  "no-restricted-syntax": [
    ...designSystemRules["no-restricted-syntax"],
    {
      selector:
        "AssignmentExpression[left.type='MemberExpression'][left.property.name=/^(status|etapa|pagoEm|motivoPerda)$/]",
      message: "Mudança de estado fora do domínio: use a função de transição em src/domain (docs/ESTADOS-E-FLUXOS.md).",
    },
  ],
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  ...storybook.configs["flat/recommended"],
  globalIgnores([
    ".next/**",
    "out/**",
    "storybook-static/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: fluxoCriticoRules,
  },
  {
    files: ["src/domain/**/*.{ts,tsx}", "src/mocks/**/*.{ts,tsx}"],
    rules: designSystemRules,
  },
  {
    files: ["**/*.test.{ts,tsx}", "e2e/**/*.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
]);

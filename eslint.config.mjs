import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import storybook from "eslint-plugin-storybook";

/**
 * Regras do design system (RNF-10): nada de cor, espaço, raio ou duração fora dos tokens.
 * Complementa `npm run check:hex`, que também cobre CSS/SVG/JSON.
 */
// Hex de 3/4 dígitos só conta se tiver letra (evita falso positivo em "Contrato #123").
const COR_LITERAL = String.raw`/(^|[^&\w])#((?=[0-9]*[a-fA-F])[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|\b(rgba?|hsla?|oklch|oklab|hwb|lab|lch|color-mix)\(/i`;
// Valores arbitrários do Tailwind (p-[13px], bg-[#fff]/50…). Variantes como data-[state=open]: e
// aria-[invalid=true]: são permitidas porque terminam em ":" (não em espaço, fim ou "/").
const TW_ARBITRARIO = String.raw`/(^|\s|:)-?[a-z][\w-]*-\[[^\]]+\](?=$|\s|\/)/`;
const TW_DURACAO_LITERAL = String.raw`/(^|\s|:)(duration|delay)-\d/`;

const regra = (selector, message) => ({ selector, message });
const MSG_COR = "Cor literal: use um token (var(--…) ou classe do tema).";
const MSG_ARB = "Valor arbitrário do Tailwind: use a escala de tokens (ou crie o token).";

const designSystemSelectors = [
  regra(`Literal[value=${COR_LITERAL}]`, MSG_COR),
  regra(`TemplateElement[value.raw=${COR_LITERAL}]`, MSG_COR),
  regra(`Literal[value=${TW_ARBITRARIO}]`, MSG_ARB),
  regra(`TemplateElement[value.raw=${TW_ARBITRARIO}]`, MSG_ARB),
  regra(`Literal[value=${TW_DURACAO_LITERAL}]`, "Duração literal: use duration-(--dur-fast|base|slow|page)."),
  regra(
    "JSXAttribute[name.name='style'] Property > Literal:not([value=/var\\(--/])",
    "Valor literal em style: use var(--token) ou uma classe do tema.",
  ),
];

/**
 * Fluxos críticos (docs/ESTADOS-E-FLUXOS.md, RNF-20): fora de src/domain ninguém muda
 * status/etapa/pagoEm/motivoPerda — sempre pela função de transição do domínio.
 * Pega atribuição direta, atribuição computada e Object.assign. Spreads ({...lead, etapa})
 * não são bloqueados (colidem com filtros por status); a defesa aí são os tipos readonly do domínio.
 */
const CAMPOS_DE_ESTADO = "/^(status|etapa|pagoEm|pagaEm|motivoPerda)$/";
const MSG_ESTADO =
  "Mudança de estado fora do domínio: use a função de transição em src/domain (docs/ESTADOS-E-FLUXOS.md).";
const fluxoCriticoSelectors = [
  regra(`AssignmentExpression[left.type='MemberExpression'][left.property.name=${CAMPOS_DE_ESTADO}]`, MSG_ESTADO),
  regra(`AssignmentExpression > MemberExpression.left[computed=true][property.value=${CAMPOS_DE_ESTADO}]`, MSG_ESTADO),
  regra(
    `CallExpression[callee.object.name='Object'][callee.property.name='assign'] ObjectExpression > Property[key.name=${CAMPOS_DE_ESTADO}]`,
    MSG_ESTADO,
  ),
];

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
  // Em flat config, um bloco posterior SUBSTITUI no-restricted-syntax; por isso cada bloco lista tudo.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: { "no-restricted-syntax": ["error", ...designSystemSelectors, ...fluxoCriticoSelectors] },
  },
  {
    // O domínio é o único lugar autorizado a mudar estado (inclusive os mocks passam por ele).
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: { "no-restricted-syntax": ["error", ...designSystemSelectors] },
  },
  {
    // Testes montam cenários com valores literais e estados arbitrários de propósito.
    files: ["**/*.test.{ts,tsx}", "e2e/**/*.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
]);

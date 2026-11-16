/**
 * Catálogo de textos FICTÍCIOS (pt-BR) para o gerador de dados mock. Nenhum dado pessoal real:
 * nomes são combinações comuns, e-mails usam `exemplo.com.br`, documentos começam com `000`
 * e telefones usam o bloco `90000-xxxx`.
 */
import type { Aleatorio } from "./aleatorio";

export const NOMES = [
  "Ana",
  "Beatriz",
  "Bruno",
  "Camila",
  "Carlos",
  "Carolina",
  "Daniel",
  "Daniela",
  "Eduardo",
  "Elisa",
  "Fábio",
  "Fernanda",
  "Gabriel",
  "Gabriela",
  "Guilherme",
  "Helena",
  "Heitor",
  "Igor",
  "Isabela",
  "Jéssica",
  "João",
  "Joana",
  "Julia",
  "Juliano",
  "Larissa",
  "Leandro",
  "Letícia",
  "Lucas",
  "Luciana",
  "Luiz",
  "Marcelo",
  "Marcos",
  "Mariana",
  "Mateus",
  "Natália",
  "Nicolas",
  "Olívia",
  "Paula",
  "Pedro",
  "Rafael",
  "Raquel",
  "Renata",
  "Ricardo",
  "Roberta",
  "Rodrigo",
  "Sabrina",
  "Samuel",
  "Sérgio",
  "Simone",
  "Tatiana",
  "Thiago",
  "Valentina",
  "Vanessa",
  "Vinícius",
  "Vitória",
  "Wagner",
  "Yasmin",
  "Otávio",
  "Cláudia",
  "Henrique",
] as const;

export const SOBRENOMES = [
  "Almeida",
  "Alves",
  "Andrade",
  "Araújo",
  "Azevedo",
  "Barbosa",
  "Batista",
  "Borges",
  "Campos",
  "Cardoso",
  "Carvalho",
  "Castro",
  "Cavalcanti",
  "Correia",
  "Costa",
  "Dias",
  "Duarte",
  "Farias",
  "Fernandes",
  "Ferreira",
  "Freitas",
  "Gomes",
  "Gonçalves",
  "Lima",
  "Lopes",
  "Machado",
  "Macedo",
  "Martins",
  "Medeiros",
  "Melo",
  "Mendes",
  "Monteiro",
  "Moraes",
  "Moreira",
  "Nascimento",
  "Nogueira",
  "Nunes",
  "Oliveira",
  "Pacheco",
  "Pereira",
  "Pinto",
  "Ramos",
  "Reis",
  "Ribeiro",
  "Rocha",
  "Rodrigues",
  "Santana",
  "Santos",
  "Silva",
  "Soares",
  "Souza",
  "Tavares",
  "Teixeira",
  "Torres",
  "Vasconcelos",
  "Vaz",
  "Viana",
  "Vieira",
  "Xavier",
  "Zanetti",
] as const;

export const NOME_LONGO_CORRETOR =
  "Maria Aparecida Fernanda de Albuquerque Cavalcanti Montenegro Bittencourt dos Santos";
export const NOME_LONGO_LEAD =
  "Antônio Carlos Henrique de Vasconcelos Albuquerque e Silva Pereira Nogueira da Fonseca Neto Filho";

/** Corretores fixos (papel, nome); o nome longo entra como um dos corretores. */
export const EQUIPE: readonly { nome: string; papel: "gestor" | "corretor" | "financeiro" }[] = [
  { nome: "Helena Vasconcelos Duarte", papel: "gestor" },
  { nome: "Rafael Monteiro Lopes", papel: "corretor" },
  { nome: "Camila Teixeira Andrade", papel: "corretor" },
  { nome: NOME_LONGO_CORRETOR, papel: "corretor" },
  { nome: "Bruno Nascimento Reis", papel: "corretor" },
  { nome: "Larissa Pacheco Gomes", papel: "corretor" },
  { nome: "Thiago Moraes Freitas", papel: "corretor" },
  { nome: "Simone Araújo Barbosa", papel: "financeiro" },
];

export type Cidade = {
  nome: string;
  uf: "SP" | "RJ" | "MG" | "PR" | "SC" | "RS";
  ddd: string;
  /** Prefixo de CEP (3 dígitos) fictício. */
  cep: string;
  peso: number;
  bairros: readonly string[];
};

export const CIDADES: readonly Cidade[] = [
  {
    nome: "São Paulo",
    uf: "SP",
    ddd: "11",
    cep: "010",
    peso: 5,
    bairros: [
      "Jardim das Acácias",
      "Vila Nova",
      "Centro",
      "Alto da Colina",
      "Parque dos Ipês",
      "Vila Aurora",
      "Jardim Primavera",
      "Bela Vista Alta",
    ],
  },
  {
    nome: "Campinas",
    uf: "SP",
    ddd: "19",
    cep: "130",
    peso: 3,
    bairros: [
      "Jardim dos Lírios",
      "Vila Esperança",
      "Centro",
      "Parque das Árvores",
      "Alto do Mirante",
      "Jardim Planalto",
    ],
  },
  {
    nome: "Curitiba",
    uf: "PR",
    ddd: "41",
    cep: "800",
    peso: 3,
    bairros: ["Jardim das Araucárias", "Vila Nova", "Centro", "Alto da Serra", "Parque do Lago", "Bairro Verde"],
  },
  {
    nome: "Belo Horizonte",
    uf: "MG",
    ddd: "31",
    cep: "300",
    peso: 3,
    bairros: [
      "Jardim das Mangabeiras",
      "Vila Serena",
      "Centro",
      "Alto do Cruzeiro",
      "Parque das Colinas",
      "Santa Clara",
    ],
  },
  {
    nome: "Rio de Janeiro",
    uf: "RJ",
    ddd: "21",
    cep: "200",
    peso: 2,
    bairros: ["Jardim Atlântico", "Vila do Mar", "Centro", "Alto da Boa Vista", "Parque das Palmeiras"],
  },
  {
    nome: "Porto Alegre",
    uf: "RS",
    ddd: "51",
    cep: "900",
    peso: 1,
    bairros: ["Jardim do Sul", "Vila Campestre", "Centro", "Alto da Colina", "Parque dos Eucaliptos"],
  },
  {
    nome: "Florianópolis",
    uf: "SC",
    ddd: "48",
    cep: "880",
    peso: 1,
    bairros: ["Jardim das Dunas", "Vila Marinha", "Centro", "Alto da Lagoa", "Parque das Gaivotas"],
  },
];

export const LOGRADOUROS = [
  "Rua das Palmeiras",
  "Avenida das Acácias",
  "Rua dos Ipês",
  "Alameda das Hortênsias",
  "Rua do Mirante",
  "Avenida Brasil Novo",
  "Rua da Paz",
  "Rua das Flores",
  "Travessa do Sol",
  "Rua Bela Vista",
  "Avenida Central",
  "Rua dos Lírios",
  "Rua do Comércio",
  "Avenida das Nações",
  "Rua Esperança",
  "Rua das Amendoeiras",
  "Alameda dos Jacarandás",
  "Rua da Colina",
  "Avenida dos Pioneiros",
  "Rua das Orquídeas",
] as const;

export const DIFERENCIAIS_RESIDENCIAL = [
  "Piscina",
  "Academia",
  "Portaria 24 h",
  "Churrasqueira",
  "Salão de festas",
  "Playground",
  "Quadra poliesportiva",
  "Sauna",
  "Espaço gourmet",
  "Jardim",
  "Lareira",
  "Armários planejados",
  "Ar-condicionado",
  "Aquecimento solar",
  "Segurança 24 h",
  "Pet friendly",
  "Varanda gourmet",
  "Vista panorâmica",
  "Coworking",
  "Bicicletário",
] as const;

export const DIFERENCIAIS_COMERCIAL = [
  "Recepção",
  "Ar-condicionado central",
  "Gerador",
  "Estacionamento rotativo",
  "Piso elevado",
  "Portaria 24 h",
  "Fibra óptica",
  "Elevador privativo",
  "Esquina",
  "Pé-direito duplo",
] as const;

export const DIFERENCIAIS_TERRENO = [
  "Escritura em dia",
  "Plano",
  "Esquina",
  "Murado",
  "Água e luz na rua",
  "Topografia favorável",
  "Aceita financiamento",
] as const;

export const ROTULO_TIPO = {
  casa: "Casa",
  apartamento: "Apartamento",
  cobertura: "Cobertura",
  terreno: "Terreno",
  comercial: "Sala comercial",
} as const;

export type ContextoTitulo = { quartos: number; suites: number; area: number; bairro: string; cidade: string };

export const TITULOS: Record<keyof typeof ROTULO_TIPO, readonly ((c: ContextoTitulo) => string)[]> = {
  casa: [
    (c) => `Casa com ${c.quartos} quartos no ${c.bairro}`,
    (c) => `Casa espaçosa de ${c.area} m² com quintal em ${c.bairro}`,
    (c) => `Sobrado de ${c.quartos} dormitórios perto de tudo, ${c.bairro}`,
    (c) => `Casa ampla com área gourmet no ${c.bairro}`,
  ],
  apartamento: [
    (c) => `Apartamento de ${c.quartos} quartos no ${c.bairro}`,
    (c) => `Apartamento ${c.area} m² com varanda em ${c.bairro}`,
    (c) => `Apartamento reformado, ${c.quartos} dormitórios, ${c.bairro}`,
    (c) => `Apartamento claro e arejado no ${c.bairro}`,
  ],
  cobertura: [
    (c) => `Cobertura duplex com ${c.suites} suítes no ${c.bairro}`,
    (c) => `Cobertura de ${c.area} m² com terraço em ${c.bairro}`,
  ],
  terreno: [
    (c) => `Terreno de ${c.area} m² no ${c.bairro}`,
    (c) => `Terreno plano pronto para construir em ${c.bairro}`,
    (c) => `Lote em esquina, ${c.bairro}`,
  ],
  comercial: [
    (c) => `Sala comercial de ${c.area} m² no ${c.bairro}`,
    (c) => `Loja de rua com vitrine em ${c.bairro}`,
    (c) => `Conjunto comercial no centro de ${c.cidade}`,
  ],
};

export const TITULO_LONGO =
  "Casa de alto padrão com piscina aquecida, área gourmet completa, jardim projetado e vista permanente para a serra, em condomínio fechado";

export const DESCRICOES: Record<keyof typeof ROTULO_TIPO, readonly string[]> = {
  casa: [
    "Casa bem conservada, com ambientes amplos e iluminação natural. Quintal com espaço para família e pets, a poucos minutos de comércio e escolas.",
    "Imóvel reformado recentemente, com acabamento de primeira. Cozinha integrada à sala e área de serviço separada.",
  ],
  apartamento: [
    "Apartamento bem distribuído, com sol da manhã e vista livre. Condomínio com ótima infraestrutura e portaria atenciosa.",
    "Unidade pronta para morar, com armários na cozinha e nos quartos. Próximo a transporte, mercados e escolas.",
  ],
  cobertura: [
    "Cobertura com terraço privativo e área de lazer exclusiva. Planta generosa, acabamento superior e vistas abertas.",
  ],
  terreno: [
    "Terreno de fácil acesso, documentação regular e topografia favorável. Ótima oportunidade para construir ou investir.",
    "Lote bem localizado, em rua asfaltada, com água, luz e esgoto disponíveis.",
  ],
  comercial: [
    "Espaço comercial com boa circulação de clientes, instalações elétricas renovadas e banheiros no pavimento.",
    "Sala pronta para uso, em prédio com recepção e elevador. Ideal para consultório, escritório ou serviços.",
  ],
};

export const MOTIVOS_INATIVO = [
  "Proprietário retirou o imóvel do mercado",
  "Documentação em regularização",
  "Imóvel em reforma",
  "Exclusividade vencida com outra imobiliária",
] as const;

export const MOTIVOS_CANCELAMENTO = [
  "Comprador não aprovou o financiamento",
  "Desistência das partes antes da escritura",
  "Locatário não passou na análise de crédito final",
  "Proprietário decidiu retirar o imóvel",
  "Acordo de rescisão amigável",
] as const;

export const NOTAS_LEAD = [
  "Cliente prefere contato por mensagem no período da tarde.",
  "Busca imóvel perto de escola; vai conversar com a família.",
  "Pediu simulação de financiamento.",
  "Quer visitar no fim de semana.",
  "Aguardando resposta do proprietário sobre a contraproposta.",
] as const;

export const OBS_VISITA = [
  "Cliente gostou da planta, achou o preço alto.",
  "Retornar com proposta formal.",
  "Visita acompanhada pelo cônjuge.",
  "Pediu para rever a área externa.",
  "Chegou com 15 minutos de atraso.",
] as const;

// ---------------------------------------------------------------------------
// Geradores de texto determinísticos (recebem o PRNG)
// ---------------------------------------------------------------------------

export function semAcento(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

export function nomeCompleto(r: Aleatorio): string {
  const dois = r.chance(0.55);
  return `${r.escolher(NOMES)} ${r.escolher(SOBRENOMES)}${dois ? ` ${r.escolher(SOBRENOMES)}` : ""}`;
}

/** E-mail fictício; domínio reservado ao projeto. */
export function emailDe(nome: string): string {
  const partes = semAcento(nome).split(".");
  const curto = partes.length > 3 ? [partes[0], partes[partes.length - 1]] : partes;
  return `${curto.join(".")}@exemplo.com.br`;
}

/** Telefone celular fictício: DDD real + `90000` + 4 dígitos (11 dígitos, sem máscara). */
export function telefoneFicticio(r: Aleatorio, ddd: string): string {
  return `${ddd}90000${String(r.inteiro(0, 9999)).padStart(4, "0")}`;
}

export function creciFicticio(r: Aleatorio, uf: string): string {
  return `CRECI-${uf} ${r.inteiro(100000, 199999)}-F`;
}

/** CPF fictício (11 dígitos, prefixo `000`, sem dígito verificador válido). */
export function cpfFicticio(r: Aleatorio): string {
  const base = `000${String(r.inteiro(0, 999999)).padStart(6, "0")}`;
  const dv = (s: string) => {
    const soma = [...s].reduce((t, c, i) => t + Number(c) * (s.length + 1 - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = dv(base);
  const d2 = dv(base + d1);
  // Último dígito propositalmente errado: nunca é um CPF válido.
  return `${base}${d1}${(d2 + 1) % 10}`;
}

/** CNPJ fictício (14 dígitos, prefixo `00000`). */
export function cnpjFicticio(r: Aleatorio): string {
  return `00000${String(r.inteiro(0, 999999999)).padStart(9, "0")}`;
}

/** Contatos fora do funil (RF-74): escritórios e serviços FICTÍCIOS. */
export const OUTROS_CONTATOS: readonly (readonly [
  string,
  "advogado" | "cartorio" | "despachante" | "outro",
  string | undefined,
])[] = [
  ["Dra. Lívia Montenegro", "advogado", "Revisa minutas de compra e venda."],
  ["Dr. Otávio Bragança", "advogado", undefined],
  ["Dra. Cecília Arantes", "advogado", "Especialista em locação comercial."],
  ["Tabelionato Exemplo de Notas — Centro", "cartorio", "Escrituras: agendar com 5 dias úteis."],
  ["Cartório Exemplo de Registro de Imóveis", "cartorio", undefined],
  ["Ofício Exemplo de Títulos e Documentos", "cartorio", undefined],
  ["Despachante Rápido Exemplo", "despachante", "Certidões em até 3 dias."],
  ["Wagner Despachos (exemplo)", "despachante", undefined],
  ["Vistorias Exemplo Ltda.", "outro", "Vistoria de entrada e saída de locação."],
  ["Fotografia Imobiliária Exemplo", "outro", undefined],
  ["Dr. Henrique Salles", "advogado", undefined],
  ["Despachante Central Exemplo", "despachante", undefined],
];

/** Despesas sem contrato (RF-78): [categoria, descrição, valor em reais]. */
export const DESPESAS_AVULSAS: readonly (readonly [
  "imposto" | "cartorio" | "certidao" | "taxa" | "despachante" | "outro",
  string,
  number,
])[] = [
  ["certidao", "Certidões para captação", 320],
  ["despachante", "Despachante: regularização de planta", 850],
  ["taxa", "Taxa de averbação de construção", 1_240],
  ["cartorio", "Reconhecimento de firmas", 96],
  ["imposto", "IPTU atrasado assumido na captação", 2_180],
  ["outro", "Cópias autenticadas", 64],
];

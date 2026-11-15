/** Exportação CSV de imóveis (RF-49). Escape, BOM e download vêm de `@/lib/csv`. */
import { FINALIDADE_ROTULO, STATUS_IMOVEL_UI, TIPO_IMOVEL_ROTULO } from "@/components/patterns/rotulos";
import type { Imovel } from "@/domain";
import { montarCsv } from "@/lib/csv";

const CABECALHO = [
  "Código",
  "Título",
  "Tipo",
  "Finalidade",
  "Status",
  "Bairro",
  "Cidade",
  "Preço (R$)",
  "Área útil (m²)",
  "Quartos",
  "Vagas",
  "Corretor",
];

const decimal = (n: number) => String(n).replace(".", ",");

export function gerarCsvImoveis(imoveis: readonly Imovel[], nomeCorretor: (id: string) => string | undefined): string {
  return montarCsv(
    CABECALHO,
    imoveis.map((i) => [
      i.codigo,
      i.titulo,
      TIPO_IMOVEL_ROTULO[i.tipo],
      FINALIDADE_ROTULO[i.finalidade],
      STATUS_IMOVEL_UI[i.status].rotulo,
      i.endereco.bairro,
      i.endereco.cidade,
      (i.preco / 100).toFixed(2).replace(".", ","),
      decimal(i.areaUtil),
      i.quartos,
      i.vagas,
      nomeCorretor(i.corretorId) ?? "",
    ]),
  );
}

import { Download, Trash2 } from "lucide-react";
import type { TipoDocumento } from "@/domain";
import { formatDataHora } from "@/lib/format";
import type { Recurso } from "@/lib/recurso";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/Table";
import { EmptyState } from "./EmptyState";
import { EstadoRecurso } from "./EstadoRecurso";
import { TIPO_DOCUMENTO_ROTULO } from "./rotulos";

export type ItemDocumento = {
  id: string;
  nome: string;
  tipo: TipoDocumento;
  /** Bytes. */
  tamanho: number;
  enviadoPor: string | null;
  enviadoEm: string;
};

export type DocumentListProps = {
  estado: Recurso<readonly ItemDocumento[]>;
  onBaixar: (id: string) => void;
  onRemover: (id: string) => void;
  /** Documento cujo download está em andamento (desabilita só o botão dele). */
  baixandoId?: string | null;
  onTentarNovamente?: () => void;
  /** Ação para sair do vazio (ex.: "Enviar documento"). */
  acaoVazio?: React.ReactNode;
  className?: string;
};

/** "2,4 MB", "35 KB", "812 B". */
export function formatTamanhoArquivo(bytes: number): string {
  const f = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  if (bytes >= 1024 * 1024) return `${f(bytes / (1024 * 1024))} MB`;
  if (bytes >= 1024) return `${f(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function DocumentListSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando documentos" className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} shape="rect" className="h-10 rounded-md" />
      ))}
    </div>
  );
}

/** Lista de documentos de um contrato (RF-76): nome, tipo, tamanho, quem enviou e quando; baixar e remover. */
export function DocumentList({
  estado,
  onBaixar,
  onRemover,
  baixandoId = null,
  onTentarNovamente,
  acaoVazio,
  className,
}: DocumentListProps) {
  return (
    <div className={className}>
      <EstadoRecurso
        estado={estado}
        carregando={<DocumentListSkeleton />}
        estaVazio={(d) => d.length === 0}
        vazio={
          <EmptyState
            tamanho="compacto"
            ilustracao="semResultados"
            titulo="Nenhum documento enviado"
            acao={acaoVazio}
          />
        }
        erro={{ titulo: "Não foi possível carregar os documentos" }}
        onTentarNovamente={onTentarNovamente}
      >
        {(docs) => (
          <Table aria-label="Documentos do contrato" density="compact" containerClassName="animate-fade-in">
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead align="right">Tamanho</TableHead>
                <TableHead>Enviado</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="max-w-64 min-w-40 font-medium break-words">{d.nome}</TableCell>
                  <TableCell className="whitespace-nowrap">{TIPO_DOCUMENTO_ROTULO[d.tipo]}</TableCell>
                  <TableCell align="right" className="tnum whitespace-nowrap">
                    {formatTamanhoArquivo(d.tamanho)}
                  </TableCell>
                  <TableCell className="min-w-40 text-text-muted">
                    {d.enviadoPor ?? "Corretor removido"} ·{" "}
                    <span className="tnum whitespace-nowrap">{formatDataHora(d.enviadoEm)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        icon={Download}
                        size="touch"
                        aria-label={`Baixar ${d.nome}`}
                        loading={baixandoId === d.id}
                        onClick={() => onBaixar(d.id)}
                      />
                      <Button
                        variant="ghost"
                        icon={Trash2}
                        size="touch"
                        aria-label={`Remover ${d.nome}`}
                        onClick={() => onRemover(d.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </EstadoRecurso>
    </div>
  );
}

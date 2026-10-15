import { cn } from "@/lib/utils";
import { iniciais } from "@/lib/format";

const DIMENSOES = {
  sm: "h-6 w-6 text-[8px]",
  md: "h-8 w-8 text-[10px]",
  lg: "h-11 w-11 text-[13px]",
} as const;

export interface AvatarProps {
  nome: string;
  tom?: "navy" | "gold";
  tamanho?: keyof typeof DIMENSOES;
  className?: string;
}

/** Avatar de iniciais — evita depender de imagens externas. */
export function Avatar({
  nome,
  tom = "navy",
  tamanho = "md",
  className,
}: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold",
        tom === "gold"
          ? "bg-gold-100 text-gold-600 dark:bg-gold-500/20 dark:text-gold-400"
          : "bg-navy-100 text-navy-800 dark:bg-navy-800/60 dark:text-navy-100",
        DIMENSOES[tamanho],
        className,
      )}
      aria-hidden="true"
    >
      {iniciais(nome)}
    </span>
  );
}

export interface PessoaTagProps {
  nome: string;
  tom?: "navy" | "gold";
  className?: string;
}

/** Avatar + nome, usado na coluna de responsável e nos cards do Kanban. */
export function PessoaTag({ nome, tom = "navy", className }: PessoaTagProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Avatar nome={nome} tom={tom} tamanho="sm" />
      <span className="text-[11px] font-medium">{nome}</span>
    </span>
  );
}

import { cn } from "@/lib/utils";

export interface OpcaoSegmentada<T extends string> {
  valor: T;
  rotulo: string;
}

export interface SegmentedControlProps<T extends string> {
  valor: T;
  opcoes: OpcaoSegmentada<T>[];
  onChange: (valor: T) => void;
  ariaLabel: string;
  className?: string;
}

/** Alternador de visão (ex.: "Minha pauta" / "Todas as intimações"). */
export function SegmentedControl<T extends string>({
  valor,
  opcoes,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex gap-1 rounded-sm bg-secondary p-1",
        className,
      )}
    >
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            aria-pressed={ativo}
            onClick={() => onChange(opcao.valor)}
            className={cn(
              "rounded-sm px-3 py-1.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              ativo
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opcao.rotulo}
          </button>
        );
      })}
    </div>
  );
}

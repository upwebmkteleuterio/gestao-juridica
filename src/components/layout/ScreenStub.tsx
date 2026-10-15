import { PageHeading, Panel } from "@/components/kit";

export interface ScreenStubProps {
  titulo: string;
  /** Classificação estrita da tela conforme o Mapa de Fluxo. */
  tipo: "Input" | "Output";
  descricao?: string;
}

/** Casca das telas: título, classificação e área reservada para os dados. */
export function ScreenStub({ titulo, tipo, descricao }: ScreenStubProps) {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow={`${tipo === "Input" ? "Tela de entrada" : "Tela de saída"} · ${tipo}`}
        titulo={titulo}
        descricao={
          descricao ??
          "Casca inicial da tela. Os componentes do UI Kit serão conectados nas próximas etapas."
        }
      />
      <Panel className="p-8">
        <h2>{titulo}</h2>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Tela em construção — nenhum dado é carregado nesta casca.
        </p>
      </Panel>
    </div>
  );
}

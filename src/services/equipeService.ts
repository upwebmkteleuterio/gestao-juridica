import { invocarFuncao } from "./erros";
import type {
  AcessoAdvogado,
  AtualizarMembroEquipeInput,
  CriarMembroEquipeInput,
  DefinirAcessoEquipeInput,
} from "@/types";

export const equipeService = {
  criarMembro(input: CriarMembroEquipeInput) {
    return invocarFuncao<{ id: string }>("gerenciar-equipe", { acao: "criar", ...input });
  },
  atualizarMembro(input: AtualizarMembroEquipeInput) {
    return invocarFuncao<{ id: string }>("gerenciar-equipe", { acao: "atualizar", ...input });
  },
  definirAcesso(input: DefinirAcessoEquipeInput) {
    return invocarFuncao<{ id: string; pode_entrar: boolean }>("gerenciar-equipe", { acao: "definir_acesso", ...input });
  },
  excluirMembro(id: string) {
    return invocarFuncao<{ id: string }>("gerenciar-equipe", { acao: "excluir", id });
  },
  listarAcesso() {
    return invocarFuncao<AcessoAdvogado[]>("gerenciar-equipe", { acao: "listar_acesso" });
  },
};

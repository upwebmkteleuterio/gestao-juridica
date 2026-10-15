export function mensagemDeErro(erro: unknown): string {
  const detalhe = erro as { code?: unknown; message?: unknown } | null;
  switch (detalhe?.code) {
    case "42501":
      return "Você não tem permissão para esta operação.";
    case "23505":
      return "Este registro já existe.";
    case "23503":
      return "Este registro está em uso e não pode ser excluído.";
    case "PGRST116":
      return "Registro não encontrado.";
    default:
      return "Não foi possível concluir a operação. Tente novamente.";
  }
}

# Tech Stack

- React + TypeScript + Vite + Tailwind CSS.
- Use React Router. KEEP the routes in `src/App.tsx` — o App contém apenas rotas e o Layout Global (`AppShell`), nunca lógica de tabelas/gráficos.
- Sempre coloque o código-fonte em `src`.
- Páginas em `src/pages/` (um arquivo por tela). Componentes em `src/components/`.
- A página padrão é `src/pages/Index.tsx`.
- Sempre tente usar a biblioteca shadcn/ui.
- Tailwind CSS para toda a estilização.

## Bibliotecas instaladas

- `lucide-react` (ícones), `react-router-dom`, `@tanstack/react-query`, `zustand`.
- Todos os componentes shadcn/ui e dependências Radix já estão instalados. **Não edite** arquivos em `src/components/ui/` — crie novos componentes em `src/components/kit/` quando precisar de variação.

# Design System (UI Kit Magalhães & Gomes)

- **Tokens centralizados** em `tailwind.config.ts` e `src/globals.css`. Mudar fonte ou cor primária reflete em todo o projeto.
- Paleta: `navy` (950/900/800/700/100), `gold` (600/500/400/100) e semânticas `success` / `warning` / `danger` / `info` (cada uma com `DEFAULT` e `bg`).
- Fontes: Segoe UI / Arial. Raios: `sm` 6px · `md` 10px · `lg` 16px. Sombra `shadow-panel`.
- **Claro/escuro**: `darkMode: ["class"]` + variáveis CSS em `:root` / `.dark`. A escolha do usuário é persistida (nunca seguir o tema do navegador). Alternador em `ThemeToggle`.
- A **sidebar permanece navy nos dois temas** (identidade da marca), com 236px de largura.
- Classes utilitárias próprias: `.eyebrow` e `.label-kit`.
- Use os componentes de `src/components/kit/` em todas as telas (Button, Badge, Panel, KpiCard, Input, CampoSenha, FormField, Table, SlidePanel, Modal, ConfirmDialog, Alert, EmptyState, ErrorState, Skeleton, Avatar, Switch, SegmentedControl, PageHeading, SectionHeading). Não repita HTML por tela.

# Arquitetura de pastas

- `/types`: interfaces que **espelham o schema do banco** (tabelas e colunas). Sem lógica.
- Dados de exemplo e a pasta `/mocks` não existem mais no projeto; os dados exibidos vêm do banco.
- `/services`: camada de acesso a dados integrada ao Supabase, organizada por entidade e integração.
- `/hooks`: lógica de dados com React Query (uma família de hooks por entidade) + hooks de UI (`useTheme`, `useOverlay`).
- `/store`: estado global com Zustand + `persist` para tema, filtros, scroll e rascunhos em `uiStore`. A sessão real do Supabase permanece apenas em memória e nunca é persistida localmente.

# Rotas

- Públicas: `/login`, `/auth/callback` e `/redefinir-senha`.
- Protegidas por `ProtectedRoute` + `AppShell` (`<Outlet />`): `/painel`, `/painel/distribuicao`, `/painel/publicacao/:id`, `/painel/novo-processo`, `/painel/marco-zero`, `/painel/encerrar-pendencias`, `/painel/arquivar`, `/painel/excluir`, `/esteira`, `/esteira/tarefa/:id`, `/esteira/novo-prazo`, `/djen`, `/djen/nova-consulta`, `/djen/payload/:id`, `/equipe`, `/equipe/novo`, `/equipe/advogado/:id`.
- Telas de modal/painel (1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1) são **sobreposições route-driven**: a rota base renderiza a tela de listagem e a rota da sobreposição renderiza a mesma tela com o modal/painel aberto, preservando o contexto. Fechar sempre volta para a rota base.
- Perfis de acesso: `admin` (sócio/gestor) e `advogado`. Consulta DJEN e Equipe são exclusivas do admin.

## Perfil do Sistema e regras de acesso

- Existem exatamente dois perfis: `admin` (inclui o antigo conceito de superadmin) e `advogado`.
- O escritório é single-tenant e colaborativo: dados de processos são compartilhados entre todos os usuários autenticados; controles e credenciais são exclusivos do admin; nenhum dado é acessível anonimamente.
- A sessão do Supabase é a fonte de verdade do usuário logado. A role da interface é lida exclusivamente de `session.user.app_metadata.perfil`, nunca de `user_metadata`.
- Nenhum dado de exemplo vai para o banco.
- Comprovantes de protocolo são enviados ao bucket privado `recibos-protocolo`.
- O **marco zero** do painel (a partir de quando o escritório contabiliza as publicações) é uma configuração única em `configuracoes_sistema`, com escopo escolhido pelo admin (indicadores / lista / exportação) e aplicada sempre no banco.
- As ações em lote do painel — encerrar pendências, arquivar e excluir — são exclusivas do admin, agem por período e são executadas por RPC (`encerrar_pendencias_periodo`, `arquivar_intimacoes_periodo`, `excluir_intimacoes_periodo`). A data usada no período é `intimacoes.data_referencia` (disponibilização do DJEN ou data de criação), mantida por trigger.

# Referências

Os documentos anexados (UI Kit, guia, blueprint e mapa de fluxo) ficam em `docs/referencias/` e **não são versionados** (`.gitignore`). A logo oficial é versionada em `public/assets/logo-magalhaes-gomes.png`.

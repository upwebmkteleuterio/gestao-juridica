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
- Use os componentes de `src/components/kit/` em todas as telas (Button, Badge, Panel, KpiCard, Input, FormField, Table, SlidePanel, Modal, ConfirmDialog, Alert, EmptyState, ErrorState, Skeleton, Avatar, Switch, SegmentedControl, PageHeading, SectionHeading). Não repita HTML por tela.

# Arquitetura de pastas

- `/types`: interfaces que **espelham o schema do banco** (tabelas e colunas). Sem lógica.
- `/mocks`: dados de exemplo, um arquivo por entidade. Nenhum dado fixo em `/services`.
- `/services`: camada de repositório, um arquivo por entidade (futura tabela Supabase). CRUD completo (`getAll`, `getById`, `create`, `update`, `remove`) sobre `criarRepositorio`, persistindo em `localStorage` com **latência simulada de 500 ms**.
- `/hooks`: lógica de dados com React Query (uma família de hooks por entidade) + hooks de UI (`useTheme`, `useOverlay`).
- `/store`: estado global com Zustand + `persist` (sessão simulada em `authStore`; tema, filtros, scroll e rascunhos em `uiStore`).

# Rotas

- Pública: `/login` (sessão simulada com escolha de perfil admin/advogado) e `/styleguide` (**playground temporário do UI Kit** — remover quando a validação terminar).
- Protegidas por `ProtectedRoute` + `AppShell` (`<Outlet />`): `/painel`, `/painel/distribuicao`, `/painel/publicacao/:id`, `/esteira`, `/esteira/tarefa/:id`, `/esteira/novo-prazo`, `/djen`, `/djen/nova-consulta`, `/djen/payload/:id`, `/equipe`, `/equipe/advogado/:id`, `/configuracoes`, `/configuracoes/editar`.
- Perfis de acesso: `admin` (sócio/gestor) e `advogado`. O advogado só vê Painel e Esteira na sidebar; Consulta DJEN, Equipe e Configurações são exclusivas do admin.

# Referências

Os documentos anexados (UI Kit, guia, blueprint e mapa de fluxo) ficam em `docs/referencias/` e **não são versionados** (`.gitignore`). A logo oficial é versionada em `public/assets/logo-magalhaes-gomes.png`.

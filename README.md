# Sistema de gestão jurídica — Magalhães & Gomes

Aplicação web para a gestão colaborativa de um escritório jurídico: acompanhamento de publicações, distribuição e execução de tarefas e prazos, além da administração da equipe.

## Tecnologias

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack React Query, Zustand e Supabase (Auth, banco de dados, Storage e Edge Functions).

## Como executar

Com Node.js e npm instalados:

```bash
npm install
npm run dev
```

O Vite inicia o servidor de desenvolvimento e informa o endereço local no terminal. Para gerar a versão de produção, use `npm run build`.

## Perfis de acesso

- **admin:** gestão da equipe e acesso às áreas administrativas, incluindo DJEN e Equipe.
- **advogado:** operação dos dados compartilhados de processos e da esteira.

O escritório é single-tenant e colaborativo. A autorização é baseada na sessão do Supabase; detalhes de acesso e dados estão em [`docs/arquitetura-acesso-e-dados.md`](docs/arquitetura-acesso-e-dados.md).

## Organização do código

- `src/types/`: tipos que espelham os dados do sistema.
- `src/services/`: acesso a dados e integrações, incluindo Supabase.
- `src/hooks/`: hooks de dados e de interface.
- `src/store/`: estado compartilhado da interface.
- `src/pages/`: telas e rotas da aplicação.
- `src/components/`: componentes funcionais organizados por área.
- `src/components/kit/`: componentes reutilizáveis do UI Kit.

## Integrações

- **DJEN:** consulta ao endpoint `https://comunicaapi.pje.jus.br/api/v1/comunicacao`; a captura e o processamento são realizados pelas Edge Functions.
- **DeepSeek:** análise de publicações com o modelo `deepseek-flash`. A chave `DEEPSEEK_API_KEY` deve permanecer configurada como secret no cofre do Supabase, nunca no navegador.
- **Comprovantes de protocolo:** arquivos guardados no bucket privado `recibos-protocolo` do Supabase Storage.

Edge Functions existentes em `supabase/functions/`: `capturar-djen`, `analisar-publicacoes` e `gerenciar-equipe`.

## Referências para desenvolvimento

Consulte [`AI_RULES.md`](AI_RULES.md) para as convenções e o design system do projeto e [`docs/arquitetura-acesso-e-dados.md`](docs/arquitetura-acesso-e-dados.md) para os invariantes de acesso e dados.

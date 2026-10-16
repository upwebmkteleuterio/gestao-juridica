# Arquitetura de acesso e dados

## Perfil do Sistema

- **Papéis:** exatamente `admin` (inclui o conceito de superadmin) e `advogado`.
- **Chave de isolamento:** nenhuma. Não há separação de dados por advogado, usuário ou organização dentro deste escritório.
- **Fronteira única:** o sistema representa um único escritório; todos os usuários autenticados colaboram nos mesmos dados operacionais.
- **Hierarquia:** `admin` administra equipe e controles do sistema; `advogado` opera os dados compartilhados de processos. Não existe terceiro perfil.
- **Como o usuário nasce:** um superadmin/admin cria ou convida o usuário pelo fluxo administrativo do Supabase Auth. Ao nascer a conta Auth, o gatilho cria automaticamente sua linha em `advogados`, inicialmente com perfil `advogado`; o perfil é sincronizado para `raw_app_meta_data.perfil` e disponibilizado no token em `app_metadata.perfil`. A promoção a `admin` é uma ação administrativa confiável.
- **Acesso público:** somente a tela de login, `/auth/callback` e `/redefinir-senha`, necessárias aos fluxos de autenticação que retornam por URL. Não há leitura anônima de dados.
- **Fluxos de autenticação que retornam por URL:** o callback `/auth/callback` troca o código OAuth/PKCE por sessão; recuperação de senha retorna a `/redefinir-senha`, onde o usuário autenticado pelo fluxo `PASSWORD_RECOVERY` define a nova senha.

## Invariantes de segurança adotados

1. A sessão do Supabase é a única fonte de verdade do usuário logado e não é persistida em Zustand nem em armazenamento local.
2. A role da interface vem exclusivamente de `session.user.app_metadata.perfil`; nunca se consulta `user_metadata` nem se consulta a tabela para determinar a role no carregamento.
3. Perfis de processo são colaborativos: todos os usuários autenticados podem ver e operar os dados compartilhados conforme as políticas do banco. Não se implementa isolamento por `advogado_id`.
4. Controles administrativos, gestão de usuários e credenciais do sistema são exclusivos de `admin`.
5. Nenhum usuário anônimo pode acessar dados. Grants e RLS são necessários em conjunto para todas as tabelas/views expostas pelo Data API.
6. Não existem dados de exemplo no projeto; todo dado exibido vem do banco.
7. A chave `service_role` nunca é distribuída ao navegador.
8. O bucket privado `recibos-protocolo` permite leitura e escrita apenas a usuários autenticados, sem acesso anônimo.

## Tabelas e regras de acesso

| Tabela ou view | Regra de acesso |
| --- | --- |
| `advogados` | Usuários autenticados podem consultar o diretório necessário à operação do escritório. Inserção, alteração de perfil e manutenção administrativa são exclusivas de `admin`; a criação automática associada ao nascimento de usuário é realizada pelo gatilho confiável. |
| `configuracoes_sistema` | Leitura para usuários autenticados quando necessária ao funcionamento compartilhado; alteração somente por `admin`. Não contém coluna de chave de API. |
| `capturas_djen` | Leitura para usuários autenticados autorizados à área DJEN; registro operacional somente por fluxos confiáveis/admin. |
| `intimacoes_djen_raw` | Payloads brutos visíveis a usuários autenticados autorizados à área DJEN; gravação por fluxo confiável de captura. |
| `intimacoes` | Dados processuais compartilhados: todos os autenticados podem consultar e realizar as operações colaborativas previstas na triagem e distribuição, sem filtro por advogado. |
| `tarefas_prazos` | Dados processuais compartilhados: todos os autenticados podem consultar e atualizar a esteira conforme as operações colaborativas; sem filtro por advogado. |
| `eventos_auditoria` | Leitura para usuários autenticados; registro permitido aos usuários autenticados para rastrear suas operações. |
| `view_produtividade_equipe` | Leitura para usuários autenticados conforme as permissões concedidas à view; reflete produtividade agregada da equipe. |

As políticas efetivas do banco são a autoridade para acesso à Data API. A interface também esconde os controles administrativos de quem não é `admin`, mas isso não substitui RLS. Nenhuma regra acima autoriza acesso anônimo.

## Notas de integração

### DJEN

- Endpoint público: `GET https://comunicaapi.pje.jus.br/api/v1/comunicacao`, sem autenticação.
- `itensPorPagina` aceita somente `5` ou `100`.
- A consulta exige ao menos um filtro forte e tem teto de 10.000 resultados.
- O limite de requisições é por IP; diante de `429`, aguardar 1 minuto antes de tentar novamente.
- Deduplicar comunicações pelo campo `id` da comunicação.

### DeepSeek

- O identificador de modelo `deepseek-flash` corresponde a V4.1-Flash.
- A chave fica somente em secret do Supabase, nunca no navegador ou em tabela.
- `ia_api_key` não existe em tabela nem na interface.

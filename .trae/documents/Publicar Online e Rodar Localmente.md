## Objetivo

Colocar o sistema online (frontend + backend) com Supabase para testes, e manter um caminho alternativo para rodar tudo localmente se preferir.

## Caminho Online (Recomendado)

1. Backend (Supabase)

* Criar/selecionar um projeto Supabase e aplicar o schema/migrações locais.

* Aplicar migrações: `supabase db push` usando `supabase/config.toml` (migrations em `supabase/migrations`).

* Deploy das Edge Functions:

  * `supabase functions deploy buscar_aluno`

  * `supabase functions deploy liberacoes_history`

* Definir secrets das functions:

  * `SUPABASE_URL`

  * `SUPABASE_ANON_KEY` (ou `SUPABASE_PUBLISHABLE_KEY`)

  * `SUPABASE_SERVICE_ROLE_KEY`

* Verificar RLS/policies para:

  * `liberacoes_lanche`: permitir `insert` e `select` para usuários autenticados.

  * `cardapios`: permitir leitura geral, update apenas para admins (conforme sua regra).

* Observação: no modo nuvem o app usa `@supabase/supabase-js` (desvia do stub local): `src/integrations/supabase/client.ts:174–189`.

1. Frontend (Vercel/Netlify)

* Importar o repositório e configurar build:

  * Build: `vite build`

  * Output: `dist`

* Variáveis de ambiente do build:

  * `VITE_SUPABASE_URL`

  * `VITE_SUPABASE_ANON_KEY`

  * Não defina `VITE_USE_LOCAL_DB` (fica false por padrão).

* Publicar e obter a URL pública (ex.: `https://cantina-verde.vercel.app`).

1. Testes de Fumaça

* Login supabase (email/senha) em `/login`: `src/pages/Login.tsx:46–71`.

* Página Cardápio: CRUD e alternância de ativo (usa `tipo_refeicao`): `src/pages/Cardapio.tsx:67–115, 143–196`.

* Liberação de Lanche:

  * Histórico via function: `supabase.functions.invoke('liberacoes_history')`: `src/pages/LiberacaoLanche.tsx:51–77`.

  * Buscar aluno: `supabase.functions.invoke('buscar_aluno')`: `src/pages/LiberacaoLanche.tsx:83–107`.

  * Inserção em `liberacoes_lanche` (RLS deve permitir): `src/pages/LiberacaoLanche.tsx:200–213`.

## Caminho Local (Alternativo)

1. Preparar ambiente

* Instalar deps: `npm i`

* Subir Postgres/Adminer: `docker compose up -d` (Adminer em `http://localhost:8080`).

1. Iniciar backend local (Express)

* `npm run server` → `http://localhost:4000`.

* Na inicialização, garante colunas/compat e seed de usuários: `server/index.js:28–40, 41–64` (inclui `tipo_refeicao` e compat de `liberacoes_lanche`: `server/index.js:35–39`).

1. Iniciar frontend

* `npm run dev` → `http://localhost:8080`.

* Usará stub local porque `VITE_USE_LOCAL_DB=true` (já em `.env.local`).

* Logins padrão: `superadmin@cantina.com / Sup3r@123`, `admin@cantina.com / Admin@123`, `user@cantina.com / User@123`.

1. Testes locais

* Cardápio: cria/ativa cardápios (com `tipo_refeicao`).

* Liberação: matrícula (12) ou pasta (4); verifica recente, regra de bolsista e insere em `liberacoes_lanche` com nomes.

## Entregáveis

* URL pública do frontend.

* Supabase project com migrações aplicadas e Edge Functions publicadas.

* Secrets configuradas nas functions.

* (Opcional) Instruções para importar dados do Supabase para o Postgres local via `scripts/export_supabase_to_sql.mjs`.

## Após sua confirmação

* Vou executar o deploy das Edge Functions e preparar o projeto Supabase.

* Configurarei as variáveis de ambiente e publicarei o frontend.

* Validarei os fluxos principais (login, cardápio, liberação) e te envio as URLs para teste.


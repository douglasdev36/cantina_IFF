<<<<<<< HEAD
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/97b4a6e1-6957-4486-b2b4-872d3115a1f3

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/97b4a6e1-6957-4486-b2b4-872d3115a1f3) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/97b4a6e1-6957-4486-b2b4-872d3115a1f3) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Banco de dados local (Docker Compose)

Este projeto inclui um `docker-compose.yml` para subir um banco PostgreSQL 15 e Adminer (GUI de banco) localmente.

Pré-requisitos:
- Docker Desktop instalado e em execução.

Como usar:
```sh
# Opcional: pare e remova containers avulsos que já usam as portas 5432/8080
docker stop cantina-postgres cantina-adminer 2> NUL || true
docker rm cantina-postgres cantina-adminer 2> NUL || true

# Subir os serviços
docker compose up -d

# Derrubar os serviços (mantendo dados)
docker compose down

# Derrubar e apagar volume/dados
docker compose down -v
```

Acessos:
- Adminer: `http://localhost:8080`
- Conexão Postgres:
  - host: `localhost`
  - port: `5432`
  - database: `cantina_verde`
  - user: `cantina_user`
  - password: `cantina_password`

Observações:
- O serviço `postgres` monta `./database/init` em `/docker-entrypoint-initdb.d`. Scripts `.sql` ou `.sh` colocados ali rodam apenas na primeira inicialização do volume.
- O volume de dados é nomeado (`postgres_data`) e persiste entre recriações dos containers.

## Exportar dados do Supabase (via API) e importar local

Para contornar restrições de rede do `pg_dump`, você pode exportar dados via API (PostgREST) usando a `service_role key` e importar no Postgres local.

Passos:

1) Obtenha as credenciais na Dashboard do Supabase:
- URL do projeto: `https://ovjmszqlfpowxkgfmhuv.supabase.co`
- Service role key: em Configurações → API
  - Link direto: https://supabase.com/dashboard/project/ovjmszqlfpowxkgfmhuv/settings/api

2) Gere o arquivo SQL com INSERTs:
- No PowerShell:
```
$env:SUPABASE_URL="https://ovjmszqlfpowxkgfmhuv.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<SUA_SERVICE_ROLE_KEY>"
node scripts/export_supabase_to_sql.mjs --out supabase_data.sql
```

3) Importe o arquivo no Postgres local (Docker Compose):
```
type supabase_data.sql | docker compose exec -T postgres psql -U cantina_user -d cantina_verde -v ON_ERROR_STOP=1
```

Notas importantes:
- A chave `anon` não consegue ignorar RLS; use a `service_role key`.
- Trate a `service_role key` como segredo; não commite no repositório.
- O script gera `INSERT ... ON CONFLICT (id) DO NOTHING` para evitar duplicatas.
- Se preferir, você pode colar o conteúdo do `supabase_data.sql` em Adminer (aba Importar) em `http://localhost:8080`.

## Rodar somente contra o Postgres local (sem tocar Supabase)

Para garantir que a aplicação não faça chamadas à Supabase (produção), habilite o modo local:

1) Copie o arquivo `.env.example` para `.env.local`:

```
cp .env.example .env.local
```

2) Verifique que `VITE_USE_LOCAL_DB=true` está definido em `.env.local`.

3) Inicie os serviços Docker (Postgres e Adminer):

```
docker compose up -d
```

4) Inicie o servidor de autenticação local (Express):

```
npm run server
```

Ele deve iniciar em `http://localhost:4000`. Você pode customizar a porta e o segredo JWT via `.env.local` usando `LOCAL_AUTH_PORT` e `LOCAL_JWT_SECRET`.

5) Inicie o frontend em modo desenvolvimento:

```
npm run dev
```

Com `VITE_USE_LOCAL_DB=true`, a aplicação:
- Não inicializa o cliente Supabase e não realiza autenticação na nuvem;
- Exige login via servidor de autenticação local (Express);
- Carrega role do usuário a partir do storage local e tabela `user_roles` (semente);
- Aplica filtros de menu conforme role (usuário comum, admin normal, super admin).

Usuários padrão disponíveis no modo local (seed automático):
- `superadmin@cantina.com` / `Sup3r@123` (role: `super_admin`)
- `admin@cantina.com` / `Admin@123` (role: `admin_normal`)
- `user@cantina.com` / `User@123` (role: `user`)

Importante:
- O frontend não se conecta diretamente ao Postgres para dados de negócio no modo local; páginas que dependem de Supabase continuarão limitadas até que endpoints locais sejam implementados.
- Use Adminer (`http://localhost:8080`) para inspecionar e operar dados diretamente ou expanda o servidor Express com APIs para suas páginas.
- Se precisar testar APIs estilo PostgREST localmente, considere subir um stack compatível apontando para o Postgres do Docker.
=======
# cantina-IFF
projeto 
>>>>>>> 58583854b178750889fedbdf8643f01c39049a90

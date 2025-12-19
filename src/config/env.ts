// Centraliza leitura de variáveis de ambiente do Vite
export const IS_LOCAL_DB = (import.meta.env.VITE_USE_LOCAL_DB === 'true');
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Aceita tanto VITE_SUPABASE_ANON_KEY quanto VITE_SUPABASE_PUBLISHABLE_KEY
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined;

// Credenciais locais do Postgres (usadas por servidores locais, não pelo frontend)
export const LOCAL_DB = {
  host: import.meta.env.VITE_LOCAL_DB_HOST || 'localhost',
  port: Number(import.meta.env.VITE_LOCAL_DB_PORT || 5432),
  database: import.meta.env.VITE_LOCAL_DB_NAME || 'cantina_verde',
  user: import.meta.env.VITE_LOCAL_DB_USER || 'cantina_user',
  password: import.meta.env.VITE_LOCAL_DB_PASSWORD || 'cantina_password',
} as const;

// URL do servidor local (auth + api)
export const LOCAL_AUTH_URL = (import.meta.env.VITE_LOCAL_AUTH_URL as string) || 'http://localhost:4000';
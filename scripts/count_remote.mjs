#!/usr/bin/env node
import process from 'node:process';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const tables = [
  'alunos',
  'cardapios',
  'categorias_produtos',
  'itens_cardapio',
  'liberacoes_lanche',
  'movimentacoes_estoque',
  'produtos',
  'turmas',
  'unidades_medida',
  'user_roles',
  'users',
];

async function countTable(t) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=id`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: 'count=exact',
      Range: '0-0',
    },
  });
  if (!res.ok) throw new Error(`Falha em ${t}: ${res.status} ${res.statusText}`);
  const cr = res.headers.get('content-range');
  const total = Number(cr?.split('/')?.[1] || 0);
  return total;
}

(async () => {
  for (const t of tables) {
    try {
      const total = await countTable(t);
      console.log(`${t}: ${total}`);
    } catch (e) {
      console.error(`${t}: erro -> ${e.message}`);
    }
  }
})();
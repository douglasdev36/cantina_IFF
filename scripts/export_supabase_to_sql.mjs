#!/usr/bin/env node
// Exporta dados do Supabase via REST (PostgREST) usando a service role key
// Gera um arquivo SQL com INSERTs e ON CONFLICT (id) DO NOTHING

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  return undefined;
}

const SUPABASE_URL = process.env.SUPABASE_URL || getArg('--url');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || getArg('--key');
const OUTPUT = process.env.OUTPUT_FILE || getArg('--out') || 'supabase_data.sql';
const TABLES_FILTER = getArg('--tables'); // e.g. "alunos,turmas"
const UPSERT = process.argv.includes('--upsert') || String(process.env.UPSERT).toLowerCase() === 'true';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY. Passe via env ou flags --url/--key.');
  process.exit(1);
}

// Ordem respeita dependências de chaves estrangeiras
const TABLES = [
  { name: 'categorias_produtos', columns: ['id', 'nome', 'created_at'] },
  { name: 'unidades_medida', columns: ['id', 'nome', 'created_at'] },
  { name: 'produtos', columns: ['id', 'nome', 'categoria', 'unidade', 'quantidade_estoque', 'quantidade_minima', 'created_at', 'updated_at'] },
  { name: 'turmas', columns: ['id', 'nome', 'created_at', 'updated_at'] },
  { name: 'users', columns: ['id', 'email', 'full_name', 'role', 'created_at', 'updated_at'] },
  { name: 'user_roles', columns: ['id', 'user_id', 'role', 'created_at'] },
  // inclui numero_pasta e e_bolsista para migrar informações de pasta e bolsa
  { name: 'alunos', columns: ['id', 'nome', 'matricula', 'numero_pasta', 'e_bolsista', 'data_nascimento', 'email', 'telefone', 'observacao', 'turma_id', 'status', 'created_at', 'updated_at'] },
  { name: 'cardapios', columns: ['id', 'nome', 'descricao', 'data_inicio', 'data_fim', 'ativo', 'created_at', 'updated_at'] },
  { name: 'itens_cardapio', columns: ['id', 'cardapio_id', 'nome', 'descricao', 'categoria', 'created_at'] },
  { name: 'liberacoes_lanche', columns: ['id', 'aluno_id', 'cardapio_id', 'data_liberacao', 'observacao', 'usuario_id', 'created_at'] },
  { name: 'movimentacoes_estoque', columns: ['id', 'produto_id', 'tipo', 'quantidade', 'observacao', 'usuario_id', 'created_at'] },
];

function esc(str) {
  return String(str).replace(/'/g, "''");
}

function sqlLiteral(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'object') return `'${esc(JSON.stringify(val))}'::jsonb`;
  // string
  return `'${esc(val)}'`;
}

async function fetchAll(table, columns) {
  const perPage = 1000;
  let start = 0;
  const all = [];
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=${columns.join(',')}`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: 'application/json',
        Prefer: 'count=exact',
        Range: `${start}-${start + perPage - 1}`,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Falha ao buscar ${table}: ${res.status} ${res.statusText} - ${text}`);
    }
    const chunk = await res.json();
    all.push(...chunk);
    const contentRange = res.headers.get('content-range'); // items start-end/total
    const total = contentRange?.split('/')?.[1];
    if (!chunk.length || (total && all.length >= Number(total))) break;
    start += perPage;
  }
  return all;
}

function generateInsert(table, columns, row) {
  const values = columns.map((c) => sqlLiteral(row[c]));
  const cols = columns.join(', ');
  const vals = values.join(', ');
  let conflict = '';
  if (columns.includes('id')) {
    if (UPSERT) {
      const setCols = columns.filter((c) => c !== 'id').map((c) => `${c} = EXCLUDED.${c}`).join(', ');
      conflict = ` ON CONFLICT (id) DO UPDATE SET ${setCols}`;
    } else {
      conflict = ' ON CONFLICT (id) DO NOTHING';
    }
  }
  return `INSERT INTO public.${table} (${cols}) VALUES (${vals})${conflict};`;
}

async function main() {
  const lines = [];
  lines.push('-- Dados exportados do Supabase via REST');
  lines.push(`-- Projeto: ${SUPABASE_URL}`);
  lines.push('SET search_path TO public;');
  lines.push('');
  const selected = TABLES_FILTER
    ? TABLES.filter((t) => TABLES_FILTER.split(',').map((s) => s.trim()).includes(t.name))
    : TABLES;
  for (const { name, columns } of selected) {
    console.log(`Exportando ${name}...`);
    const rows = await fetchAll(name, columns);
    lines.push(`-- Tabela ${name} (${rows.length} linhas)`);
    for (const row of rows) {
      lines.push(generateInsert(name, columns, row));
    }
    lines.push('');
  }
  fs.writeFileSync(path.resolve(OUTPUT), lines.join('\n'), 'utf8');
  console.log(`Arquivo SQL gerado em ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
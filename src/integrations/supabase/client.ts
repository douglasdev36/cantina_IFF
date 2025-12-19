// Cliente Supabase (desativável em modo local)
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { IS_LOCAL_DB, SUPABASE_URL, SUPABASE_ANON_KEY, LOCAL_AUTH_URL } from '@/config/env';
import { getUser as getLocalUser, getToken as getLocalToken } from '@/integrations/localAuth';

// Stub robusto para evitar chamadas à nuvem em modo local
function createQueryBuilderLocal(table: string) {
  const state = {
    table,
    filters: [] as Array<{ op: 'eq' | 'gte' | 'lte' | 'lt' | 'gt' | 'in'; col: string; val: unknown }>,
    order: null as null | { col: string; ascending: boolean },
    limit: null as null | number,
  };

  function applyFilters(data: unknown[]) {
    let out = Array.isArray(data) ? (data.slice() as Record<string, unknown>[]) : [];
    const isDateCol = (col: string) => (
      col === 'data_validade' || col === 'data_inicio' || col === 'data_fim' || col === 'created_at' || col === 'updated_at' || col === 'data_liberacao'
    );
    type Cmp = number | string;
    const toCmp = (col: string, v: unknown): Cmp => {
      if (v == null) return '';
      if (isDateCol(col)) return new Date(String(v)).getTime();
      const num = Number(v);
      return Number.isNaN(num) ? String(v) : num;
    };
    const cmpOp = (a: Cmp, b: Cmp, op: 'gte' | 'lte' | 'gt' | 'lt') => {
      if (typeof a === 'number' && typeof b === 'number') {
        if (op === 'gte') return a >= b;
        if (op === 'lte') return a <= b;
        if (op === 'gt') return a > b;
        return a < b;
      }
      const as = String(a);
      const bs = String(b);
      if (op === 'gte') return as >= bs;
      if (op === 'lte') return as <= bs;
      if (op === 'gt') return as > bs;
      return as < bs;
    };
    for (const f of state.filters) {
      if (f.op === 'eq') out = out.filter((r) => r?.[f.col] === f.val);
      if (f.op === 'gte') out = out.filter((r) => cmpOp(toCmp(f.col, r?.[f.col]), toCmp(f.col, f.val), 'gte'));
      if (f.op === 'lte') out = out.filter((r) => cmpOp(toCmp(f.col, r?.[f.col]), toCmp(f.col, f.val), 'lte'));
      if (f.op === 'gt') out = out.filter((r) => cmpOp(toCmp(f.col, r?.[f.col]), toCmp(f.col, f.val), 'gt'));
      if (f.op === 'lt') out = out.filter((r) => cmpOp(toCmp(f.col, r?.[f.col]), toCmp(f.col, f.val), 'lt'));
      if (f.op === 'in') {
        const set = new Set(Array.isArray(f.val) ? f.val : [f.val]);
        out = out.filter((r) => set.has(r?.[f.col]));
      }
    }
    if (state.order) {
      const { col, ascending } = state.order;
      out.sort((a, b) => {
        const va = toCmp(col, a?.[col]);
        const vb = toCmp(col, b?.[col]);
        if (va === vb) return 0;
        if (typeof va === 'number' && typeof vb === 'number') return ascending ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
        const as = String(va);
        const bs = String(vb);
        return ascending ? (as < bs ? -1 : 1) : (as > bs ? -1 : 1);
      });
    }
    if (typeof state.limit === 'number') out = out.slice(0, state.limit);
    return out;
  }

  async function getAll() {
    const token = getLocalToken();
    const res = await fetch(`${LOCAL_AUTH_URL}/api/${state.table}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const text = await res.text();
      return { data: [], error: { message: text || 'Falha na API local' }, count: 0 };
    }
    const data = await res.json();
    const filtered = applyFilters(data);
    return { data: filtered, error: null, count: filtered.length };
  }

  const builder = {
    select: (_cols?: string, _opts?: unknown) => builder,
    eq: (col: string, val: unknown) => { state.filters.push({ op: 'eq', col, val }); return builder; },
    gte: (col: string, val: unknown) => { state.filters.push({ op: 'gte', col, val }); return builder; },
    lte: (col: string, val: unknown) => { state.filters.push({ op: 'lte', col, val }); return builder; },
    gt: (col: string, val: unknown) => { state.filters.push({ op: 'gt', col, val }); return builder; },
    lt: (col: string, val: unknown) => { state.filters.push({ op: 'lt', col, val }); return builder; },
    in: (col: string, vals: unknown[]) => { state.filters.push({ op: 'in', col, val: vals }); return builder; },
    order: (col: string, options?: { ascending?: boolean }) => { state.order = { col, ascending: options?.ascending !== false }; return builder; },
    limit: (n: number) => { state.limit = n; return builder; },
    insert: async (values: unknown) => {
      const token = getLocalToken();
      const res = await fetch(`${LOCAL_AUTH_URL}/api/${state.table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(values),
      });
      const body = await res.json().catch(() => null);
      return { data: res.ok ? [body] : [], error: res.ok ? null : body || { message: 'Erro ao inserir' } };
    },
    update: async (values: unknown) => {
      const idEq = state.filters.find((f) => f.op === 'eq' && f.col === 'id');
      if (!idEq) return { data: [], error: { message: 'Atualização local requer eq("id", ...)' } };
      const token = getLocalToken();
      const res = await fetch(`${LOCAL_AUTH_URL}/api/${state.table}/${idEq.val}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(values),
      });
      const body = await res.json().catch(() => null);
      return { data: res.ok ? [body] : [], error: res.ok ? null : body || { message: 'Erro ao atualizar' } };
    },
    delete: async () => {
      const idEq = state.filters.find((f) => f.op === 'eq' && f.col === 'id');
      if (!idEq) return { data: [], error: { message: 'Remoção local requer eq("id", ...)' } };
      const token = getLocalToken();
      const res = await fetch(`${LOCAL_AUTH_URL}/api/${state.table}/${idEq.val}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return { data: [], error: res.ok ? null : { message: 'Erro ao remover' } };
    },
    maybeSingle: async () => {
      const list = await getAll();
      return { data: list.data?.[0] ?? null, error: list.error };
    },
    single: async () => {
      const list = await getAll();
      return { data: list.data?.[0] ?? null, error: list.error };
    },
    then: (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) => getAll().then(onFulfilled, onRejected),
    catch: (onRejected: (reason: unknown) => unknown) => getAll().catch(onRejected),
    finally: (onFinally: () => void) => getAll().finally(onFinally),
  };

  return builder;
}

const supabaseStub = {
  auth: {
    async getUser() {
      const u = getLocalUser();
      if (!u) return { data: { user: null }, error: null };
      return {
        data: {
          user: {
            id: u.id,
            email: u.email,
            user_metadata: { full_name: u.full_name, role: u.role },
          },
        },
        error: null,
      };
    },
    async getSession() {
      return { data: { session: null }, error: null };
    },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } };
    },
    async signInWithPassword() {
      return { data: null, error: { message: 'Modo local: autenticação desativada' } };
    },
    async signUp() {
      return { data: null, error: { message: 'Modo local: cadastro desativado' } };
    },
    async signOut() {
      return { error: null };
    },
  },
  from: (table: string) => createQueryBuilderLocal(table),
  rpc: async (fn: string, args?: unknown) => {
    const token = getLocalToken();
    const res = await fetch(`${LOCAL_AUTH_URL}/rpc/${fn}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(args || {}),
    });
    const body = await res.json().catch(() => null);
    return { data: res.ok ? body : null, error: res.ok ? null : body || { message: 'Erro na RPC local' } };
  },
  functions: {
    async invoke(name: string, _options?: { body?: unknown }) {
      const token = getLocalToken();
      const res = await fetch(`${LOCAL_AUTH_URL}/functions/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(_options?.body || {}),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) return { data: null, error: body || { message: 'Erro em função local' } };
      return { data: body, error: null };
    },
  },
};

// Exporta stub quando em modo local OU quando variáveis do Supabase não estão definidas
const SHOULD_USE_STUB = IS_LOCAL_DB || !SUPABASE_URL || !SUPABASE_ANON_KEY;

export const supabase = SHOULD_USE_STUB
  ? supabaseStub
  : createClient<Database>(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );

// Dica de uso:
// import { supabase } from "@/integrations/supabase/client";

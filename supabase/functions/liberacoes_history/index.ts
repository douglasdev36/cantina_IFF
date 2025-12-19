// Supabase Edge Function: liberacoes_history
// Returns recent lunch releases with student details using service role (RLS bypass)
// Only accessible to authenticated users (we validate the JWT from the request)

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Liberacao = {
  id: string;
  data_liberacao: string;
  observacao: string | null;
  turma_nome: string | null;
  cardapio_nome: string | null;
  tipo_refeicao: string | null;
  alunos: {
    nome: string | null;
    matricula: string | null;
    numero_pasta: string | null;
  } | null;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders } });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return new Response(
        JSON.stringify({ error: "missing_env", details: { url: !!supabaseUrl, anonKey: !!anonKey, serviceKey: !!serviceKey } }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const authHeader = req.headers.get("Authorization") ?? "";

    // Validate user is authenticated using anon client with the provided JWT
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData } = await authClient.auth.getUser();
    if (!authData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Admin client with service role to bypass RLS for the join
    const admin = createClient(supabaseUrl, serviceKey);

    const { limit } = (await req.json().catch(() => ({}))) as { limit?: number };
    const take = Math.min(Math.max(limit ?? 10, 1), 100);

    const { data, error } = await admin
      .from("liberacoes_lanche")
      .select(
        `id, data_liberacao, observacao, turma_nome, cardapio_nome, tipo_refeicao, alunos(nome, matricula, numero_pasta)`
      )
      .order("data_liberacao", { ascending: false })
      .limit(take);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const liberacoes = (data as Liberacao[]).map((lib) => ({
      id: lib.id,
      data_liberacao: lib.data_liberacao,
      observacao: lib.observacao,
      turma_nome: lib.turma_nome,
      cardapio_nome: lib.cardapio_nome,
      tipo_refeicao: lib.tipo_refeicao,
      aluno: {
        nome: lib.alunos?.nome ?? null,
        matricula: lib.alunos?.matricula ?? null,
        numero_pasta: lib.alunos?.numero_pasta ?? null,
      },
    }));

    return new Response(JSON.stringify({ liberacoes }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

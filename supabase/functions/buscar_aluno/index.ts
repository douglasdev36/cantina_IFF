// Supabase Edge Function: buscar_aluno
// Looks up a student by matricula (12) or numero_pasta (4) using service role
// Only accessible to authenticated users

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Validate auth
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

    // Parse body
    const body = await req.json().catch(() => ({}));
    const codigo: string | undefined = body.codigo;

    if (!codigo || (codigo.length !== 4 && codigo.length !== 12)) {
      return new Response(JSON.stringify({ aluno: null }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const normalized = String(codigo).trim().replace(/\D/g, '');

    let query = admin
      .from("alunos")
      .select(`id, nome, matricula, numero_pasta, e_bolsista, turmas(nome)`) // assumes FK relationship in Supabase
      .limit(1);

    if (normalized.length === 12) {
      query = query.eq("matricula", normalized);
    } else {
      const padded = normalized.padStart(4, '0');
      query = query.or(`numero_pasta.eq.${normalized},numero_pasta.eq.${padded}`);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return new Response(JSON.stringify({ aluno: null }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    type AlunoRow = {
      id: string;
      nome?: string | null;
      matricula?: string | null;
      numero_pasta?: string | null;
      e_bolsista?: boolean | null;
      turmas?: { nome?: string | null } | null;
    };
    const aluno = (data as AlunoRow | null)
      ? {
          id: (data as AlunoRow).id,
          nome: (data as AlunoRow).nome ?? "",
          matricula: (data as AlunoRow).matricula ?? "",
          numero_pasta: (data as AlunoRow).numero_pasta ?? null,
          turma_nome: (data as AlunoRow).turmas?.nome ?? null,
          e_bolsista: (data as AlunoRow).e_bolsista ?? false,
        }
      : null;

    return new Response(JSON.stringify({ aluno }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

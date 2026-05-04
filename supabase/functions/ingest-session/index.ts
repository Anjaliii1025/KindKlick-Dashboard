// Extension -> backend: log a browsing session.
// Auth: header `x-device-token: <token>` from device_tokens table.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  domain: string;
  title?: string;
  category?: string;
  status?: "safe" | "warning" | "blocked";
  duration_seconds?: number;
  visited_at?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const token = req.headers.get("x-device-token");
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing x-device-token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: childIdData, error: tokErr } = await admin.rpc("resolve_device_token", { _token: token });
    if (tokErr || !childIdData) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const childId = childIdData as string;

    const body = await req.json() as Body;
    if (!body?.domain || typeof body.domain !== "string") {
      return new Response(JSON.stringify({ error: "domain required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const status = ["safe", "warning", "blocked"].includes(body.status ?? "") ? body.status! : "safe";
    const duration = Math.max(0, Math.min(7200, Number(body.duration_seconds ?? 0)));

    const { error: insErr } = await admin.from("sessions").insert({
      child_id: childId,
      domain: body.domain.slice(0, 255),
      title: body.title?.slice(0, 500) ?? null,
      category: body.category?.slice(0, 64) ?? null,
      status,
      duration_seconds: duration,
      visited_at: body.visited_at ?? new Date().toISOString(),
    });
    if (insErr) throw insErr;

    await admin.from("device_tokens").update({ last_used_at: new Date().toISOString() }).eq("token", token);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ingest-session", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

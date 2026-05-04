// Extension -> backend: fetch settings (limits + blocklist) for the bound child.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-token",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const { data: childId, error: tokErr } = await admin.rpc("resolve_device_token", { _token: token });
    if (tokErr || !childId) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: child }, { data: blocked }, { data: schedules }, { data: today }] = await Promise.all([
      admin.from("children").select("id,name,daily_limit_minutes").eq("id", childId).single(),
      admin.from("blocked_sites").select("domain,is_whitelist,category").eq("child_id", childId),
      admin.from("focus_schedules").select("name,days_of_week,start_time,end_time,is_active").eq("child_id", childId).eq("is_active", true),
      admin.from("screen_time").select("total_minutes,limit_minutes").eq("child_id", childId).eq("date", new Date().toISOString().slice(0, 10)).maybeSingle(),
    ]);

    return new Response(JSON.stringify({
      child_id: childId,
      child_name: child?.name,
      daily_limit_minutes: child?.daily_limit_minutes ?? 240,
      used_minutes_today: today?.total_minutes ?? 0,
      block_list: (blocked ?? []).filter(b => !b.is_whitelist).map(b => b.domain),
      allow_list: (blocked ?? []).filter(b => b.is_whitelist).map(b => b.domain),
      focus_schedules: schedules ?? [],
      synced_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("get-settings", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

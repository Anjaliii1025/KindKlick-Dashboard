// KindKlick AI chat — calls Lovable AI Gateway with REAL DB context.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const buildParentPrompt = (ctx: any) => `You are KindKlick AI, a warm, professional parenting assistant focused on child internet safety.
Real data for ${ctx.childName} (age ${ctx.age ?? "?"}):
- Today: ${ctx.todayMin} min screen time of ${ctx.limitMin} min daily limit.
- Last 24h: ${ctx.sessionCount} sites visited, ${ctx.blockedCount} blocked attempts.
- Top categories (last 7d): ${ctx.topCategories || "none yet"}.
- Recent blocked: ${ctx.recentBlocked || "none"}.
- Recent safe sites: ${ctx.recentSafe || "none"}.
- Open alerts: ${ctx.openAlerts}.
Rules: Reply in the SAME language as the user (English or Hindi/Hinglish). Be warm, human-like, and CONCISE — like a friend texting back, not a long essay. Do NOT repeat or rephrase the same point. Use markdown sparingly (bold, short bullets) only when it helps. Aim for 2-5 sentences unless the user asks for detail. Reference ${ctx.childName} by name when relevant.`;

const buildChildPrompt = (ctx: any) => `You are KindKlick Buddy, a friendly fun AI for kids 6-14. ${ctx.childName} is ${ctx.age ?? 10}.
Always be encouraging, use simple fun language with relevant emojis. NEVER discuss adult, violent, or scary topics — gently redirect.
Suggest educational activities and safe websites. Reply in the same language the child uses (Hindi or English). Keep replies SHORT (2-3 sentences).`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode = "parent", childName: fallbackName = "Your child" } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context from real DB if a parent JWT is present
    const ctx: any = { childName: fallbackName, todayMin: 0, limitMin: 240, sessionCount: 0, blockedCount: 0, topCategories: "", recentBlocked: "", recentSafe: "", openAlerts: 0, age: null };

    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const userClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } },
        );
        const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
        if (claims?.claims?.sub) {
          const { data: child } = await userClient
            .from("children").select("id,name,age,daily_limit_minutes")
            .eq("parent_id", claims.claims.sub).order("created_at").limit(1).maybeSingle();
          if (child) {
            ctx.childName = child.name;
            ctx.age = child.age;
            ctx.limitMin = child.daily_limit_minutes;
            const today = new Date().toISOString().slice(0, 10);
            const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
            const since7d = new Date(Date.now() - 7 * 86400 * 1000).toISOString();

            const [st, sess, blockedAttempts, safeRecent, blockedRecent, alertsOpen, cat7d] = await Promise.all([
              userClient.from("screen_time").select("total_minutes").eq("child_id", child.id).eq("date", today).maybeSingle(),
              userClient.from("sessions").select("id", { count: "exact", head: true }).eq("child_id", child.id).gte("visited_at", since24h),
              userClient.from("sessions").select("id", { count: "exact", head: true }).eq("child_id", child.id).eq("status", "blocked").gte("visited_at", since24h),
              userClient.from("sessions").select("domain").eq("child_id", child.id).eq("status", "safe").order("visited_at", { ascending: false }).limit(5),
              userClient.from("sessions").select("domain").eq("child_id", child.id).eq("status", "blocked").order("visited_at", { ascending: false }).limit(5),
              userClient.from("alerts").select("id", { count: "exact", head: true }).eq("child_id", child.id).eq("is_dismissed", false),
              userClient.from("sessions").select("category").eq("child_id", child.id).gte("visited_at", since7d).not("category", "is", null).limit(500),
            ]);

            ctx.todayMin = st.data?.total_minutes ?? 0;
            ctx.sessionCount = sess.count ?? 0;
            ctx.blockedCount = blockedAttempts.count ?? 0;
            ctx.openAlerts = alertsOpen.count ?? 0;
            ctx.recentSafe = (safeRecent.data ?? []).map(s => s.domain).join(", ");
            ctx.recentBlocked = (blockedRecent.data ?? []).map(s => s.domain).join(", ");
            const counts: Record<string, number> = {};
            (cat7d.data ?? []).forEach(r => { if (r.category) counts[r.category] = (counts[r.category] ?? 0) + 1; });
            ctx.topCategories = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3)
              .map(([k, v]) => `${k} ${v}`).join(", ");
          }
        }
      } catch (e) {
        console.warn("kindklick-chat: ctx fetch failed", e);
      }
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const system = mode === "child" ? buildChildPrompt(ctx) : buildParentPrompt(ctx);

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit. Please try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`AI error ${resp.status}: ${t}`);
    }

    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ reply, context: ctx }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("kindklick-chat error", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

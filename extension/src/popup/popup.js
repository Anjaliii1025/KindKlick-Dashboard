const $ = id => document.getElementById(id);
const send = m => new Promise(r => chrome.runtime.sendMessage(m, r));
const fmt = n => `${n} min`;
const pct = (a, b) => b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0;

async function refresh() {
  const s = await send({ type: "GET_STATE" });
  if (!s) return;
  const paired = !!s.token;
  $("paired").hidden = !paired;
  $("setup").hidden = paired;
  $("status").textContent = paired ? "Connected to dashboard" : "Not paired";
  if (paired) {
    const set = s.settings || {};
    $("daily").textContent = `${fmt(s.usage.daily)} / ${fmt(set.dailyLimitMinutes || 0)}`;
    $("dailyBar").style.width = pct(s.usage.daily, set.dailyLimitMinutes) + "%";
    $("weekly").textContent = `${fmt(s.usage.weekly)} / ${fmt(set.weeklyLimitMinutes || 0)}`;
    $("weeklyBar").style.width = pct(s.usage.weekly, set.weeklyLimitMinutes) + "%";
    $("session").textContent = `${fmt(s.usage.session)} / ${fmt(set.maxSessionLengthMinutes || 0)}`;
    $("queue").textContent = s.queued ?? 0;
  }
}

$("pair").addEventListener("click", async () => {
  const t = $("token").value.trim();
  if (!t) return;
  await send({ type: "SET_TOKEN", token: t });
  await refresh();
});
$("unpair").addEventListener("click", async () => {
  if (!confirm("Unpair this device?")) return;
  await send({ type: "CLEAR_TOKEN" }); await refresh();
});
$("override").addEventListener("click", async () => {
  await send({ type: "OVERRIDE", minutes: 15 }); alert("Override active 15 min");
});
$("options").addEventListener("click", () => chrome.runtime.openOptionsPage());
$("options2").addEventListener("click", () => chrome.runtime.openOptionsPage());

refresh();

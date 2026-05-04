import { getSettings, setSettings, KEYS, get, set, defaultSettings } from "../shared/storage.js";
import { sha256 } from "../shared/encryption.js";
import { audit } from "../shared/audit.js";
import { getUsage } from "../shared/screenTimeManager.js";

const $ = id => document.getElementById(id);
let unlocked = false;

async function pinExists() { return !!(await get(KEYS.PIN, null)); }

async function refreshPinStatus() {
  const exists = await pinExists();
  $("pinStatus").textContent = exists ? (unlocked ? "PIN: unlocked" : "PIN: locked") : "PIN: not set";
  document.querySelectorAll("input,textarea,button").forEach(el => {
    if (["pin","pin2","savePin","unlockBtn","token","pair","unpair","exportCsv","options2"].includes(el.id)) return;
    el.disabled = exists && !unlocked;
  });
}

$("savePin").addEventListener("click", async () => {
  const a = $("pin").value.trim(); const b = $("pin2").value.trim();
  if (a.length < 4) return alert("PIN must be at least 4 digits");
  if (a !== b) return alert("PINs do not match");
  if (await pinExists() && !unlocked) return alert("Unlock with current PIN first");
  await set(KEYS.PIN, await sha256(a));
  unlocked = true;
  audit("pin_set");
  $("pin").value = ""; $("pin2").value = "";
  await refreshPinStatus();
  alert("PIN saved");
});

$("unlockBtn").addEventListener("click", async () => {
  const stored = await get(KEYS.PIN, null);
  if (!stored) { unlocked = true; return refreshPinStatus(); }
  const got = await sha256($("pin").value.trim());
  if (got === stored) { unlocked = true; $("pin").value = ""; audit("pin_unlock"); refreshPinStatus(); }
  else { audit("pin_unlock_fail"); alert("Wrong PIN"); }
});

// ---------- cloud ----------
const send = m => new Promise(r => chrome.runtime.sendMessage(m, r));
async function refreshCloud() {
  const st = await send({ type: "GET_STATE" });
  $("cloudStatus").textContent = st?.token
    ? `Status: connected · ${st.cloud?.child_name ?? "child"} · ${st.queued} queued`
    : "Status: not paired";
}
$("pair").addEventListener("click", async () => {
  const t = $("token").value.trim(); if (!t) return;
  await send({ type: "SET_TOKEN", token: t });
  $("token").value = ""; refreshCloud();
});
$("unpair").addEventListener("click", async () => {
  if (!confirm("Unpair?")) return; await send({ type: "CLEAR_TOKEN" }); refreshCloud();
});

// ---------- settings ----------
function readDays() {
  return Array.from($("dayPick").querySelectorAll("input:checked")).map(i => Number(i.value));
}
function renderSchedules(s) {
  const ul = $("schedules"); ul.innerHTML = "";
  (s.schedules || []).forEach(sch => {
    const li = document.createElement("li");
    const days = sch.days.map(d => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d]).join(",");
    li.innerHTML = `<span>${sch.active ? "✅" : "⏸"} <b>${sch.name || "Schedule"}</b> · ${days} · ${sch.start} → ${sch.end}</span>`;
    const btn = document.createElement("button"); btn.className = "danger"; btn.textContent = "Delete";
    btn.onclick = async () => {
      const cur = await getSettings();
      cur.schedules = cur.schedules.filter(x => x.id !== sch.id);
      await setSettings(cur); load();
    };
    li.appendChild(btn); ul.appendChild(li);
  });
}
function renderCategories(s) {
  const wrap = $("cats"); wrap.innerHTML = "";
  Object.keys(defaultSettings.enabledCategories).forEach(cat => {
    const id = "cat_" + cat;
    const lab = document.createElement("label");
    lab.innerHTML = `<input type="checkbox" id="${id}" ${s.enabledCategories[cat] ? "checked" : ""}/> Block ${cat}`;
    wrap.appendChild(lab);
  });
}

async function load() {
  const s = await getSettings();
  $("daily").value = s.dailyLimitMinutes;
  $("weekly").value = s.weeklyLimitMinutes;
  $("session").value = s.maxSessionLengthMinutes;
  $("warn").value = s.warnAtMinutesRemaining;
  $("allowList").value = (s.allowList || []).join("\n");
  $("blockList").value = (s.blockList || []).join("\n");
  renderSchedules(s);
  renderCategories(s);
  const u = await getUsage();
  $("usedToday").textContent = u.daily;
  $("usedBar").style.width = (s.dailyLimitMinutes ? Math.min(100, (u.daily / s.dailyLimitMinutes) * 100) : 0) + "%";
  await renderAudit();
  await refreshCloud();
  await refreshPinStatus();
}

$("addSched").addEventListener("click", async () => {
  const cur = await getSettings();
  cur.schedules = cur.schedules || [];
  cur.schedules.push({
    id: crypto.randomUUID(),
    name: $("schName").value.trim() || "Schedule",
    days: readDays(),
    start: $("schStart").value || "22:00",
    end: $("schEnd").value || "06:00",
    active: true,
  });
  await setSettings(cur);
  audit("schedule_added");
  $("schName").value = "";
  load();
});

$("save").addEventListener("click", async () => {
  const cur = await getSettings();
  cur.dailyLimitMinutes = +$("daily").value || 0;
  cur.weeklyLimitMinutes = +$("weekly").value || 0;
  cur.maxSessionLengthMinutes = +$("session").value || 0;
  cur.warnAtMinutesRemaining = +$("warn").value || 0;
  cur.allowList = $("allowList").value.split("\n").map(s => s.trim()).filter(Boolean);
  cur.blockList = $("blockList").value.split("\n").map(s => s.trim()).filter(Boolean);
  cur.enabledCategories = {};
  Object.keys(defaultSettings.enabledCategories).forEach(cat => {
    cur.enabledCategories[cat] = !!$("cat_" + cat)?.checked;
  });
  await setSettings(cur);
  audit("settings_saved");
  alert("Settings saved");
  load();
});

$("resetUsage").addEventListener("click", async () => {
  if (!confirm("Reset today's screen-time counter?")) return;
  await set(KEYS.TIME_EVENTS, []);
  audit("usage_reset");
  load();
});

async function renderAudit() {
  const log = (await get(KEYS.AUDIT, [])) || [];
  const tbody = $("auditTable").querySelector("tbody"); tbody.innerHTML = "";
  log.slice(-50).reverse().forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${new Date(e.ts).toLocaleString()}</td><td>${e.action}</td><td>${JSON.stringify(e.details || {})}</td>`;
    tbody.appendChild(tr);
  });
}

$("exportCsv").addEventListener("click", async () => {
  const log = (await get(KEYS.AUDIT, [])) || [];
  const rows = [["timestamp","action","details"]].concat(
    log.map(e => [new Date(e.ts).toISOString(), e.action, JSON.stringify(e.details || {})])
  );
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a"); a.href = url; a.download = "kindklick-audit.csv"; a.click();
  URL.revokeObjectURL(url);
});

load();

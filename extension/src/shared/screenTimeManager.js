// Enforces daily/weekly/session/bedtime limits. Pure functions over event log.
import { KEYS, get, set, pushCapped } from "./storage.js";

const EVENT_CAP = 10000;

export async function logTimeMinute(domain) {
  await pushCapped(KEYS.TIME_EVENTS, { ts: Date.now(), domain }, EVENT_CAP);
}

function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x.getTime(); }
function startOfWeek(d = new Date()) { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0,0,0,0); return x.getTime(); }

export async function getUsage() {
  const events = (await get(KEYS.TIME_EVENTS, [])) || [];
  const now = Date.now();
  const dayStart = startOfDay();
  const weekStart = startOfWeek();
  const daily = events.filter(e => e.ts >= dayStart).length;
  const weekly = events.filter(e => e.ts >= weekStart).length;
  // session = consecutive minute pings within 2 min gap
  let session = 0;
  for (let i = events.length - 1; i >= 0; i--) {
    const next = events[i + 1]?.ts ?? now;
    if (next - events[i].ts <= 120_000) session++; else break;
  }
  return { daily, weekly, session };
}

function inWindow(now, startHHMM, endHHMM) {
  const [sh, sm] = startHHMM.split(":").map(Number);
  const [eh, em] = endHHMM.split(":").map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  return s <= e ? (cur >= s && cur < e) : (cur >= s || cur < e); // wraps midnight
}

export function isBedtime(settings, now = new Date()) {
  for (const sch of (settings.schedules || [])) {
    if (!sch.active) continue;
    if (Array.isArray(sch.days) && !sch.days.includes(now.getDay())) continue;
    if (sch.start && sch.end && inWindow(now, sch.start, sch.end)) return sch;
  }
  return null;
}

export async function evaluateLimits(settings) {
  const u = await getUsage();
  const reasons = [];
  if (settings.dailyLimitMinutes > 0 && u.daily >= settings.dailyLimitMinutes)
    reasons.push("Daily time limit reached");
  if (settings.weeklyLimitMinutes > 0 && u.weekly >= settings.weeklyLimitMinutes)
    reasons.push("Weekly time limit reached");
  if (settings.maxSessionLengthMinutes > 0 && u.session >= settings.maxSessionLengthMinutes)
    reasons.push("Session time limit reached — take a break");
  const bed = isBedtime(settings);
  if (bed) reasons.push(`Bedtime active: ${bed.name || "Schedule"}`);
  return { usage: u, blocked: reasons.length > 0, reasons };
}

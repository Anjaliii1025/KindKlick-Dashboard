// Cloud sync to KindKlick Supabase backend.
import { KEYS, get, set } from "./storage.js";

const SUPABASE_URL = "https://vbzlntfgyowtewagonzx.supabase.co";
const INGEST_URL = `${SUPABASE_URL}/functions/v1/ingest-session`;
const SETTINGS_URL = `${SUPABASE_URL}/functions/v1/get-settings`;

export async function getToken() { return (await get(KEYS.TOKEN, null)) || null; }
export async function setToken(t) { await set(KEYS.TOKEN, t); }
export async function clearToken() { await chrome.storage.local.remove([KEYS.TOKEN, KEYS.CLOUD_SETTINGS]); }

async function enqueue(body) {
  const q = (await get(KEYS.QUEUE, [])) || [];
  q.push(body);
  await set(KEYS.QUEUE, q.slice(-200));
}

export async function postSession(body) {
  const token = await getToken();
  if (!token) return enqueue(body);
  try {
    const r = await fetch(INGEST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-device-token": token },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return true;
  } catch {
    await enqueue(body);
    return false;
  }
}

export async function flushQueue() {
  const token = await getToken();
  if (!token) return;
  const q = (await get(KEYS.QUEUE, [])) || [];
  if (!q.length) return;
  const keep = [];
  for (const item of q) {
    try {
      const r = await fetch(INGEST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-device-token": token },
        body: JSON.stringify(item),
      });
      if (!r.ok) throw 0;
    } catch { keep.push(item); }
  }
  await set(KEYS.QUEUE, keep);
}

export async function syncCloudSettings() {
  const token = await getToken();
  if (!token) return null;
  try {
    const r = await fetch(SETTINGS_URL, { headers: { "x-device-token": token } });
    if (!r.ok) return null;
    const data = await r.json();
    await set(KEYS.CLOUD_SETTINGS, data);
    return data;
  } catch { return null; }
}

export async function getCloudSettings() { return (await get(KEYS.CLOUD_SETTINGS, null)) || null; }

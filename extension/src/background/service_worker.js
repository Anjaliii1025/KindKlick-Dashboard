// KindKlick service worker — orchestrates blocking, time tracking, cloud sync.
import { getSettings, KEYS, get, set } from "../shared/storage.js";
import { decide } from "../shared/engine.js";
import { domainOf } from "../shared/url.js";
import { logTimeMinute, getUsage } from "../shared/screenTimeManager.js";
import { categorize } from "../shared/contentAnalysis.js";
import { audit } from "../shared/audit.js";
import { postSession, syncCloudSettings, flushQueue, getCloudSettings } from "../shared/cloudSync.js";

const HEARTBEAT_MIN = 0.5; // 30 seconds
const SETTINGS_MIN = 1;    // 60 seconds
const TIME_TICK_MIN = 1;

const active = new Map(); // tabId -> { domain, title, startedAt }

function getBlockedUrl(domain, reason, category) {
  return chrome.runtime.getURL("src/blocked/blocked.html") +
    `?domain=${encodeURIComponent(domain)}&reason=${encodeURIComponent(reason)}&category=${encodeURIComponent(category || "")}`;
}

async function endSession(tabId, status = "safe") {
  const s = active.get(tabId);
  if (!s) return;
  active.delete(tabId);
  const dur = Math.max(1, Math.round((Date.now() - s.startedAt) / 1000));
  postSession({
    domain: s.domain, title: s.title, category: categorize(s.domain).category,
    status, duration_seconds: dur,
  });
}

async function startSession(tabId, url, title) {
  const d = domainOf(url);
  if (!d) return;
  if (active.has(tabId)) await endSession(tabId);
  active.set(tabId, { domain: d, title: title || d, startedAt: Date.now() });
}

async function evaluate(tabId, url, title) {
  const domain = domainOf(url);
  if (!domain) return;
  const settings = await getSettings();
  const cloudSettings = await getCloudSettings();
  const verdict = await decide({ url, domain, settings, cloudSettings });

  if (!verdict.allow) {
    audit("url_blocked", { domain, reason: verdict.reason, category: verdict.category });
    postSession({
      domain, title: title || null, category: verdict.category || categorize(domain).category,
      status: "blocked", duration_seconds: 1,
    });
    chrome.tabs.update(tabId, { url: getBlockedUrl(domain, verdict.reason, verdict.category) });
    return;
  }
  await startSession(tabId, url, title);
}

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === "complete" && tab.url) evaluate(tabId, tab.url, tab.title);
});
chrome.tabs.onRemoved.addListener((tabId) => endSession(tabId));
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  for (const id of Array.from(active.keys())) if (id !== tabId) await endSession(id);
  try { const t = await chrome.tabs.get(tabId); if (t?.url) await startSession(tabId, t.url, t.title); } catch {}
});

chrome.alarms.create("kk_heartbeat", { periodInMinutes: HEARTBEAT_MIN });
chrome.alarms.create("kk_settings",  { periodInMinutes: SETTINGS_MIN });
chrome.alarms.create("kk_tick",      { periodInMinutes: TIME_TICK_MIN });

chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name === "kk_heartbeat") {
    for (const [_, s] of active.entries()) {
      const dur = Math.max(1, Math.round((Date.now() - s.startedAt) / 1000));
      postSession({ domain: s.domain, title: s.title, category: categorize(s.domain).category, status: "safe", duration_seconds: dur });
      s.startedAt = Date.now();
    }
    flushQueue();
  } else if (a.name === "kk_settings") {
    syncCloudSettings();
    // Re-check active tabs against new rules
    for (const [tabId, s] of active.entries()) {
      try { const tab = await chrome.tabs.get(tabId); if (tab?.url) evaluate(tabId, tab.url, tab.title); } catch {}
    }
  } else if (a.name === "kk_tick") {
    if (active.size > 0) {
      const first = active.values().next().value;
      await logTimeMinute(first?.domain || "");
      const settings = await getSettings();
      const u = await getUsage();
      const remaining = settings.dailyLimitMinutes ? settings.dailyLimitMinutes - u.daily : null;
      if (remaining === settings.warnAtMinutesRemaining) {
        chrome.notifications?.create?.({
          type: "basic", iconUrl: "icons/icon.png", title: "KindKlick",
          message: `${remaining} minutes of screen time remaining today.`,
        });
      }
    }
  }
});

chrome.runtime.onInstalled.addListener(() => { syncCloudSettings(); audit("installed"); });
chrome.runtime.onStartup.addListener(() => { syncCloudSettings(); });

chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  (async () => {
    try {
      if (msg.type === "GET_TIME_STATUS") {
        const settings = await getSettings();
        const usage = await getUsage();
        const cloud = await getCloudSettings();
        sendResponse({ settings, usage, cloud });
      } else if (msg.type === "GET_STATE") {
        const token = await get(KEYS.TOKEN, null);
        const cloud = await getCloudSettings();
        const queue = (await get(KEYS.QUEUE, [])) || [];
        const usage = await getUsage();
        const settings = await getSettings();
        sendResponse({ token, cloud, queued: queue.length, usage, settings });
      } else if (msg.type === "SET_TOKEN") {
        await set(KEYS.TOKEN, msg.token);
        await syncCloudSettings();
        audit("token_paired");
        sendResponse({ ok: true });
      } else if (msg.type === "CLEAR_TOKEN") {
        await chrome.storage.local.remove([KEYS.TOKEN, KEYS.CLOUD_SETTINGS]);
        audit("token_cleared");
        sendResponse({ ok: true });
      } else if (msg.type === "OVERRIDE") {
        const minutes = Math.min(180, Math.max(1, Number(msg.minutes) || 15));
        await set(KEYS.OVERRIDE_UNTIL, Date.now() + minutes * 60_000);
        audit("override", { minutes });
        sendResponse({ ok: true });
      } else if (msg.type === "TEMP_ALLOW") {
        const map = (await get(KEYS.TEMP_ALLOW, {})) || {};
        map[msg.domain] = Date.now() + (Number(msg.minutes) || 10) * 60_000;
        await set(KEYS.TEMP_ALLOW, map);
        audit("temp_allow", { domain: msg.domain, minutes: msg.minutes });
        sendResponse({ ok: true });
      }
    } catch (e) { sendResponse({ error: String(e.message || e) }); }
  })();
  return true;
});

// Local-first storage with default settings.
export const KEYS = {
  SETTINGS: "kk.settings.v1",
  TIME_EVENTS: "kk.time_events.v1",
  AUDIT: "kk.audit.v1",
  PIN: "kk.pin.v1",
  TOKEN: "kk.token.v1",
  CLOUD_SETTINGS: "kk.cloud_settings.v1",
  QUEUE: "kk.queue.v1",
  OVERRIDE_UNTIL: "kk.override.v1",
  TEMP_ALLOW: "kk.temp_allow.v1",
};

export const defaultSettings = {
  dailyLimitMinutes: 120,
  weeklyLimitMinutes: 600,
  maxSessionLengthMinutes: 60,
  warnAtMinutesRemaining: 15,
  enabledCategories: {
    Adult: true, Violence: true, SelfHarm: true,
    Drugs: true, Gambling: false, SocialMedia: false,
  },
  schedules: [], // { id, name, days:[0..6], start:"22:00", end:"06:00", active:true }
  blockList: [],
  allowList: [],
  safeSearch: true,
};

export async function getSettings() {
  const o = await chrome.storage.local.get(KEYS.SETTINGS);
  return { ...defaultSettings, ...(o[KEYS.SETTINGS] || {}) };
}
export async function setSettings(s) {
  await chrome.storage.local.set({ [KEYS.SETTINGS]: s });
}
export async function get(key, fallback = null) {
  const o = await chrome.storage.local.get(key);
  return o[key] ?? fallback;
}
export async function set(key, val) {
  await chrome.storage.local.set({ [key]: val });
}
export async function pushCapped(key, item, cap) {
  const arr = (await get(key, [])) || [];
  arr.push(item);
  if (arr.length > cap) arr.splice(0, arr.length - cap);
  await set(key, arr);
}

import { getSettings } from "./storage.js";

const DEFAULT_MODEL_API_BASE_URL = "https://kindklick-parent-hub.vercel.app";

function normalizeBaseUrl(raw) {
  const value = String(raw || DEFAULT_MODEL_API_BASE_URL).trim().replace(/\/$/, "");
  return value.endsWith("/api") ? value : `${value}/api`;
}

async function getApiBaseUrl() {
  const settings = await getSettings();
  return normalizeBaseUrl(settings.modelApiBaseUrl);
}

async function postJson(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const baseUrl = await getApiBaseUrl();
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function normalizeResultLabel(result) {
  return String(result || "").trim().toLowerCase().replace(/\s+/g, "_");
}

export async function scanUrlSafety(url) {
  try {
    const data = await postJson("/analyze/url", { url });
    const result = normalizeResultLabel(data?.result);
    const blocked = result === "phishing" || result === "unsafe" || result === "malicious";
    return {
      ok: true,
      blocked,
      result,
      confidence: Number(data?.confidence || 0),
      reason: blocked ? "Blocked by AI phishing detector" : "URL appears safe",
      category: blocked ? "Fraud" : "General",
      raw: data,
    };
  } catch (error) {
    return {
      ok: false,
      blocked: false,
      result: "unknown",
      confidence: 0,
      reason: String(error?.message || error || "URL model unavailable"),
      category: "General",
    };
  }
}

export async function scanTextSafety(text) {
  const trimmed = String(text || "").trim();
  if (trimmed.length < 8) {
    return { ok: true, blocked: false, result: "safe", confidence: 0, reason: "Too short to scan", category: "General" };
  }

  try {
    const data = await postJson("/analyze/text", { text: trimmed.slice(0, 6000) });
    const result = normalizeResultLabel(data?.result);
    const blocked = result !== "safe";
    return {
      ok: true,
      blocked,
      result,
      confidence: Number(data?.confidence || 0),
      reason: blocked ? "Blocked by AI text safety model" : "Text appears safe",
      category: blocked ? "UnsafeText" : "General",
      raw: data,
    };
  } catch (error) {
    return {
      ok: false,
      blocked: false,
      result: "unknown",
      confidence: 0,
      reason: String(error?.message || error || "Text model unavailable"),
      category: "General",
    };
  }
}

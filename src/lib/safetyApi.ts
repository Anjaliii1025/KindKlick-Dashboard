export type TextScanResponse = {
  input: string;
  cleaned_text: string;
  result: string;
  confidence: number;
  raw_prediction: string;
};

export type UrlScanResponse = {
  input: string;
  result: string;
  confidence: number;
  raw_prediction: string;
};

const rawBase = import.meta.env.VITE_MODEL_API_BASE_URL?.trim();
const API_BASE = rawBase
  ? rawBase.replace(/\/$/, "")
  : import.meta.env.DEV
    ? "http://127.0.0.1:8000"
    : "";

async function postJson<T>(path: string, body: Record<string, string>): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function scanText(text: string) {
  return postJson<TextScanResponse>("/analyze/text", { text });
}

export function scanUrl(url: string) {
  return postJson<UrlScanResponse>("/analyze/url", { url });
}

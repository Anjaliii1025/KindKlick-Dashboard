export function domainOf(url) {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return null;
    return u.hostname.replace(/^www\./, "");
  } catch { return null; }
}

export function matchesDomain(domain, list) {
  if (!domain || !Array.isArray(list)) return false;
  return list.some(d => {
    const dd = String(d).toLowerCase().trim().replace(/^www\./, "");
    return domain === dd || domain.endsWith("." + dd);
  });
}

const RISK_PATTERNS = [
  /translate\.google/i, /\.proxy\./i, /vpn/i, /unblock/i, /webproxy/i, /hidemyass/i,
];
export function urlRiskScore(url) {
  let score = 0;
  if (RISK_PATTERNS.some(p => p.test(url))) score += 0.6;
  if (/[?&](url|q|target)=https?/.test(url)) score += 0.3;
  return Math.min(1, score);
}

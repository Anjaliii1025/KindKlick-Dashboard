// Decision engine combining local + cloud rules.
import { matchesDomain, urlRiskScore } from "./url.js";
import { categorize } from "./contentAnalysis.js";
import { evaluateLimits, isBedtime } from "./screenTimeManager.js";
import { KEYS, get } from "./storage.js";

export async function decide({ url, domain, settings, cloudSettings }) {
  // Temporary parent override
  const overrideUntil = (await get(KEYS.OVERRIDE_UNTIL, 0)) || 0;
  if (overrideUntil > Date.now()) return { allow: true, reason: "Parent override active" };

  // Per-domain temp allows
  const temp = (await get(KEYS.TEMP_ALLOW, {})) || {};
  if (temp[domain] && temp[domain] > Date.now()) return { allow: true, reason: "Temp approved" };

  // Allow lists win
  if (matchesDomain(domain, settings.allowList)) return { allow: true, reason: "Allowed by parent" };
  if (cloudSettings && matchesDomain(domain, cloudSettings.allow_list || [])) return { allow: true, reason: "Allowed by parent" };

  // Block lists
  if (matchesDomain(domain, settings.blockList)) return { allow: false, reason: "Site is on block list", category: "Manual" };
  if (cloudSettings && matchesDomain(domain, cloudSettings.block_list || []))
    return { allow: false, reason: "Site blocked by parent", category: "Manual" };

  // Time + bedtime
  const limits = await evaluateLimits(settings);
  if (limits.blocked) return { allow: false, reason: limits.reasons[0], category: "Time" };

  // Cloud-side daily limit
  if (cloudSettings?.daily_limit_minutes && cloudSettings.used_minutes_today >= cloudSettings.daily_limit_minutes) {
    return { allow: false, reason: "Daily screen-time limit reached", category: "Time" };
  }

  // Content categories
  const c = categorize(domain, url);
  if (c.confidence > 0.4 && settings.enabledCategories?.[c.category]) {
    return { allow: false, reason: `Blocked category: ${c.category}`, category: c.category, confidence: c.confidence };
  }

  // Bypass risk
  if (urlRiskScore(url) > 0.5) return { allow: false, reason: "Suspected bypass tool", category: "Bypass" };

  return { allow: true, category: c.category };
}

export { isBedtime };

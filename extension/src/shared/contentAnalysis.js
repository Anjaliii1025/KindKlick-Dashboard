// Lightweight heuristic content classifier — domain + URL keyword based.
const KEYWORDS = {
  Adult:      [/porn/i, /xxx/i, /xvideo/i, /onlyfans/i, /redtube/i, /nsfw/i, /sex/i, /hentai/i],
  Violence:   [/gore/i, /beheading/i, /shooting/i, /\bkill/i, /violence/i],
  SelfHarm:   [/suicide/i, /self[-_ ]?harm/i, /cutting/i, /anorexia/i],
  Drugs:      [/cocaine/i, /heroin/i, /weed/i, /marijuana/i, /\bdrug/i],
  Gambling:   [/casino/i, /poker/i, /bet365/i, /gambling/i, /sportsbook/i],
  SocialMedia:[/instagram/i, /facebook/i, /tiktok/i, /snapchat/i, /twitter/i, /\bx\.com/i],
};

export function categorize(domain, url = "") {
  const haystack = (domain || "") + " " + (url || "");
  const scores = {};
  for (const [cat, pats] of Object.entries(KEYWORDS)) {
    const hits = pats.reduce((n, p) => n + (p.test(haystack) ? 1 : 0), 0);
    if (hits) scores[cat] = Math.min(1, hits / 2);
  }
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return top ? { category: top[0], confidence: top[1] } : { category: "General", confidence: 0 };
}

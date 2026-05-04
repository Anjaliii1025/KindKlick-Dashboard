const SEARCH_PARAM_KEYS = ["q", "query", "search_query", "search", "p", "text", "wd"];
let initialScanSent = false;

function extractSearchQueryFromUrl() {
  try {
    const url = new URL(window.location.href);
    for (const key of SEARCH_PARAM_KEYS) {
      const value = url.searchParams.get(key);
      if (value && value.trim().length >= 3) return value.trim();
    }
  } catch {}
  return "";
}

function getSearchInputValue(form) {
  const selectors = [
    'input[type="search"]',
    'input[name*="q" i]',
    'input[name*="search" i]',
    'input[aria-label*="search" i]',
    'textarea[name*="q" i]',
    'textarea[name*="search" i]',
  ];

  for (const selector of selectors) {
    const element = form.querySelector(selector);
    const value = element?.value?.trim();
    if (value && value.length >= 3) return value;
  }

  const genericInputs = Array.from(form.querySelectorAll('input[type="text"], textarea'));
  for (const input of genericInputs) {
    const value = input?.value?.trim();
    if (value && value.length >= 3) return value;
  }

  return "";
}

function getVisiblePageText() {
  const title = document.title || "";
  const bodyText = document.body?.innerText || "";
  return `${title}\n${bodyText}`.replace(/\s+/g, " ").trim().slice(0, 6000);
}

async function sendInitialPageScan() {
  if (initialScanSent) return;
  initialScanSent = true;

  const text = getVisiblePageText();
  const searchQuery = extractSearchQueryFromUrl();
  if (!text && !searchQuery) return;

  try {
    await chrome.runtime.sendMessage({
      type: "SCAN_PAGE_TEXT",
      pageUrl: window.location.href,
      title: document.title,
      text,
      searchQuery,
    });
  } catch {}
}

document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;

  const query = getSearchInputValue(form);
  if (!query) return;

  event.preventDefault();

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SCAN_SEARCH_QUERY",
      pageUrl: window.location.href,
      title: document.title,
      query,
    });

    if (response?.allow) {
      form.submit();
      return;
    }

    if (response?.blockedUrl) {
      window.location.href = response.blockedUrl;
    }
  } catch {
    form.submit();
  }
}, true);

window.addEventListener("load", () => {
  window.setTimeout(sendInitialPageScan, 900);
});

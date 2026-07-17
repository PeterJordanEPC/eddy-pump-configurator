import { JSDOM } from "jsdom";

const DEFAULT_BASE_URL = "https://configurator.eddypump.com";

export function hasForbiddenScriptHost(
  html,
  forbiddenHosts,
  baseUrl = DEFAULT_BASE_URL,
) {
  const document = new JSDOM(html, { url: baseUrl }).window.document;

  return [...document.scripts].some((script) => {
    try {
      const hostname = new URL(script.src, baseUrl).hostname.toLowerCase();
      return forbiddenHosts.has(hostname);
    } catch {
      // A script URL that cannot be parsed is not safe to release.
      return true;
    }
  });
}

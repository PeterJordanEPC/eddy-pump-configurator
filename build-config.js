export const RAILWAY_API_BASE = "https://api-production-1940.up.railway.app";

function httpsOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    throw new Error("CONFIGURATOR_API_BASE must be an HTTPS origin without a path, credentials, query, or fragment");
  }
  return url.origin;
}

export function resolveSiteConfig(environment = process.env) {
  return Object.freeze({
    apiBase: httpsOrigin(environment.CONFIGURATOR_API_BASE || RAILWAY_API_BASE),
    fallbackApiBase: RAILWAY_API_BASE,
    releaseId: "configurator-v2",
    sourceMaps: false,
  });
}

export const SITE_CONFIG = resolveSiteConfig();

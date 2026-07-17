export const ASSET_MANIFEST = Object.freeze({
  dredging: "images/dredging.webp",
});

export function assetFor(kind) {
  return ASSET_MANIFEST[kind] || null;
}

import { cp, mkdir, rm } from "node:fs/promises";

const output = ".pages";
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const path of ["index.html", "app.js", "styles.css", "privacy.html", "CNAME", "images"]) {
  await cp(path, `${output}/${path}`, { recursive: true });
}

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const files = ["app.js", "index.html"];
const digest = async () => createHash("sha256").update(Buffer.concat(await Promise.all(files.map((file) => readFile(file))))).digest("hex");
const before = await digest();
const result = spawnSync(process.execPath, ["scripts/build.mjs"], { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status || 1);
const after = await digest();
if (before !== after) throw new Error("Generated files were stale before the deterministic rebuild");
console.log("PASS deterministic generated app.js and index.html");

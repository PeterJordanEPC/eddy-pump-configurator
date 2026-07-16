import { readFileSync, statSync } from "node:fs";

const index = readFileSync("index.html", "utf8");
const source = readFileSync("src/app.jsx", "utf8");
const bundle = readFileSync("app.js", "utf8");

const checks = [
  [!index.includes("text/babel") && !index.includes("@babel/standalone"), "runtime Babel removed"],
  [index.includes("Content-Security-Policy"), "CSP meta present"],
  [index.includes("integrity=\"sha384-"), "third-party scripts use SRI"],
  [index.includes("images/eddy-pump-corporation-logo.webp") || source.includes("images/eddy-pump-corporation-logo.webp"), "local corporate logo used"],
  [source.includes('window.location.protocol !== "https:"'), "HTTPS submission guard present"],
  [source.includes("validEmail") && source.includes("consent"), "email and consent validation present"],
  [source.includes("<details className=\"projectDetails\">"), "optional engineering fields are progressive disclosure"],
  [!source.includes("PHOTO PLACEHOLDER"), "prototype placeholder copy removed"],
  [bundle.length > 1000 && bundle.length < 100000, "production bundle has expected size"],
  [statSync("images/eddy-pump-corporation-logo.webp").size < 100000, "optimized logo is present"],
];

const failed = checks.filter(([ok]) => !ok);
for (const [ok, label] of checks) console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
if (failed.length) process.exit(1);

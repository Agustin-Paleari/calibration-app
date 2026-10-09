import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename } from "node:path";
let html = readFileSync("dist/index.html", "utf8");
const script = html.match(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/);
const style = html.match(/<link\b[^>]*\bhref="([^"]+\.css)"[^>]*>/);
if (!script || !style)
  throw new Error("No se encontraron los recursos de la compilación.");
const js = readFileSync(`dist${script[1]}`, "utf8").replace(
  /<\/script/gi,
  "<\\/script",
);
const css = readFileSync(`dist${style[1]}`, "utf8").replace(
  /url\(([^)]+)\)/g,
  (match, raw) => {
    const path = raw.replace(/["']/g, "");
    if (path.startsWith("data:")) return match;
    if (!path.endsWith(".woff2"))
      throw new Error(`Recurso CSS inesperado: ${path}`);
    return `url(data:font/woff2;base64,${readFileSync(`dist/assets/${basename(path)}`).toString("base64")})`;
  },
);
html = html
  .replace(script[0], `<script type="module">${js}</script>`)
  .replace(style[0], `<style>${css}</style>`);
const favicon = `data:image/svg+xml;base64,${readFileSync("public/favicon.svg").toString("base64")}`;
html = html.replace('href="/favicon.svg"', `href="${favicon}"`);
mkdirSync("docs", { recursive: true });
writeFileSync("docs/Calibration-Hub.html", html);
console.log("Versión autónoma creada: docs/Calibration-Hub.html");

import { cpSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, "..", "node_modules", "@bryllim", "workout-guide", "assets");
const dest = join(__dirname, "..", "public", "guide-assets");

if (!existsSync(src)) {
  console.warn("[copy-guide-assets] source not found:", src);
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true, force: true });
console.log(`[copy-guide-assets] copied ${src} -> ${dest}`);

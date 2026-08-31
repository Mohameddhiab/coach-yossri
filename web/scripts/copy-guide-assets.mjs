import { cpSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, "..", "node_modules", "@bryllim", "workout-guide", "assets");
const dest = join(__dirname, "..", "public", "guide-assets");

if (!existsSync(src)) {
  console.warn("[copy-guide-assets] source not found:", src);
  console.warn("[copy-guide-assets] hint: ensure @bryllim/workout-guide is installed (npm install)");
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true, force: true });
try {
  const count = readdirSync(dest).length;
  console.log(`[copy-guide-assets] copied ${src} -> ${dest} (${count} entries)`);
  if (count === 0) console.warn("[copy-guide-assets] WARNING: dest empty after copy");
} catch (e) {
  console.log(`[copy-guide-assets] copied ${src} -> ${dest} (count check failed: ${e?.message})`);
}

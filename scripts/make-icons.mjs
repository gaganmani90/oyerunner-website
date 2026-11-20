// node scripts/make-icons.mjs
// Rebuilds the app icons in public/icons/ from public/favicon.svg (white mark on brand red).
// Only needed if the logo changes.
import fs from "node:fs";
import sharp from "sharp";

const svg = fs.readFileSync(new URL("../public/favicon.svg", import.meta.url), "utf8");
const paths = [...svg.matchAll(/<path[^>]*d="([^"]+)"/g)].map((m) => m[1]);
const [vx, vy, vw, vh] = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);

function icon(size, markShare) {
  const h = size * markShare;
  const scale = h / vh;
  const w = vw * scale;
  const tx = (size - w) / 2 - vx * scale;
  const ty = (size - h) / 2 - vy * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="100%" height="100%" fill="#BE2227"/><g transform="translate(${tx} ${ty}) scale(${scale})" fill="#fff">${paths.map((d) => `<path d="${d}"/>`).join("")}</g></svg>`;
}

fs.mkdirSync(new URL("../public/icons/", import.meta.url), { recursive: true });
for (const [name, size, share] of [
  ["icon-180.png", 180, 0.56],
  ["icon-192.png", 192, 0.56],
  ["icon-512.png", 512, 0.56],
  ["icon-maskable-512.png", 512, 0.42],
]) {
  await sharp(Buffer.from(icon(size, share))).png().toFile(new URL(`../public/icons/${name}`, import.meta.url).pathname);
  console.log("wrote public/icons/" + name);
}

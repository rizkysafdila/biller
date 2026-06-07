import sharp from "sharp";
import { mkdirSync } from "node:fs";

// App icon: teal rounded square with a white receipt glyph (torn bottom edge
// + text lines). Full-bleed background so it doubles as a maskable icon.
const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#14b8a6"/>
  <path d="M160 116 H352 V356 l-24 20 -24 -20 -24 20 -24 -20 -24 20 -24 -20 -24 20 -24 -20 Z" fill="#ffffff"/>
  <rect x="188" y="166" width="136" height="20" rx="10" fill="#0f766e"/>
  <rect x="188" y="212" width="136" height="16" rx="8" fill="#5eead4"/>
  <rect x="188" y="248" width="96" height="16" rx="8" fill="#5eead4"/>
  <rect x="188" y="300" width="84" height="20" rx="10" fill="#0f766e"/>
  <circle cx="312" cy="310" r="14" fill="#14b8a6"/>
</svg>`;

const buf = Buffer.from(svg);
mkdirSync("public/icons", { recursive: true });

const targets = [
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-512.png", 512],
  ["public/icons/icon-maskable-512.png", 512],
  ["public/icons/apple-icon-180.png", 180],
  ["public/icons/favicon-32.png", 32],
];

await Promise.all(
  targets.map(([file, size]) =>
    sharp(buf).resize(size, size).png().toFile(file),
  ),
);

console.log("Generated", targets.length, "icons in public/icons");

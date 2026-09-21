import sharp from "sharp";
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "src/Public/logo icon.png");

mkdirSync(resolve(root, "public"), { recursive: true });

const targets = [
  { file: "src/app/icon.png", width: 32 },
  { file: "src/app/apple-icon.png", width: 180, background: "#ffffff" },
  { file: "public/icon-192.png", width: 192, background: "#ffffff" },
  { file: "public/icon-512.png", width: 512, background: "#ffffff" },
];

for (const target of targets) {
  let pipeline = sharp(source);
  if (target.fit === "contain" && target.width && target.height) {
    pipeline = pipeline.resize({ width: target.width, height: target.height, fit: "contain" });
  } else if (target.width) {
    pipeline = pipeline.resize({ width: target.width, height: target.width, fit: "cover" });
  }
  if (target.background) pipeline = pipeline.flatten({ background: target.background });
  await pipeline.toFile(resolve(root, target.file));
  const out = resolve(root, target.file);
  const meta = await sharp(out).metadata();
  const bytes = statSync(out).size;
  console.log(`${target.file}\t${meta.width}x${meta.height}\t${Math.round(bytes / 1024)}KB`);
}

copyFileSync(source, resolve(root, "public/logo.png"));
console.log("source copied -> public/logo.png");
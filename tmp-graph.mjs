import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve as presolve } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const files = walk(SRC);
const graph = new Map();

const ALIAS = {
  "@/": join(SRC, ""),
};

function resolveSpec(spec, fromFile) {
  let base;
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve2(dirname(fromFile), spec);
  else return null; // node_modules
  for (const cand of [base, base + ".ts", base + ".tsx", base + ".js", base + ".mjs", join(base, "index.ts"), join(base, "index.tsx")]) {
    try {
      if (statSync(cand).isFile()) return cand;
    } catch {}
  }
  return null;
}

function resolve2(d, spec) {
  return presolve(d, spec);
}

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s+["']([^"']+)["']/g;
const BARE_IMPORT_RE = /(?:^|\n)\s*import\s+["']([^"']+)["']/g;

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const deps = new Set();
  let m;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(src))) {
    const r = resolveSpec(m[1], file);
    if (r) deps.add(r);
  }
  BARE_IMPORT_RE.lastIndex = 0;
  while ((m = BARE_IMPORT_RE.exec(src))) {
    const r = resolveSpec(m[1], file);
    if (r) deps.add(r);
  }
  graph.set(file, deps);
}

const targets = new Set(
  [join(SRC, "lib/published-catalogue.ts"), join(SRC, "lib/catalogue.ts"), join(SRC, "data/products.json")]
    .filter((f) => {
      try { return statSync(f).isFile(); } catch { return false; }
    })
);

const clientFiles = files.filter((f) => {
  const head = readFileSync(f, "utf8").slice(0, 400);
  return /^\s*["']use client["']/.test(head);
});

console.log("client components:", clientFiles.length);
console.log("targets:", [...targets].map((t) => t.replace(ROOT + "\\", "")));
console.log("");

// BFS from each client file to nearest target
const results = [];
for (const cf of clientFiles) {
  // BFS
  const prev = new Map([[cf, null]]);
  const q = [cf];
  let found = null;
  while (q.length) {
    const cur = q.shift();
    if (cur !== cf && targets.has(cur)) { found = cur; break; }
    for (const d of graph.get(cur) ?? []) {
      if (!prev.has(d)) { prev.set(d, cur); q.push(d); }
    }
  }
  if (found) {
    const path = [];
    let n = found;
    while (n) { path.unshift(n.replace(ROOT + "\\", "")); n = prev.get(n); }
    results.push({ client: cf.replace(ROOT + "\\", ""), target: found.replace(ROOT + "\\", ""), path, depth: path.length - 1 });
  }
}

results.sort((a, b) => a.depth - b.depth);
console.log("=== CLIENT COMPONENTS REACHING CATALOGUE DATA ===");
for (const r of results) {
  console.log(`\n[depth ${r.depth}] ${r.client}`);
  for (const p of r.path) console.log("    " + p);
}
console.log("\ntotal leaking client components:", results.length);

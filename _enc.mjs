const BASE = "http://localhost:3000";

async function tryFetch(path, encoding, timeoutMs) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    const res = await fetch(BASE + path, {
      headers: encoding ? { "accept-encoding": encoding } : {},
      signal: ac.signal,
    });
    const reader = res.body.getReader();
    let bytes = 0;
    let ttfb = null;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (ttfb === null) ttfb = Date.now() - t0;
      bytes += value.length;
    }
    clearTimeout(t);
    return `OK   ${String(bytes / 1024).toFixed(0).padStart(5)}KB  ttfb=${ttfb}ms total=${Date.now() - t0}ms  enc=${res.headers.get("content-encoding") || "identity"} len=${res.headers.get("content-length") || "chunked"}`;
  } catch (e) {
    clearTimeout(t);
    const cause = e.cause ? `${e.cause.code || ""} ${e.cause.message || ""}`.trim() : "";
    return `FAIL ${String(e.name + " | " + cause).slice(0, 70).padEnd(70)} after ${Date.now() - t0}ms`;
  }
}

for (const path of ["/", "/products", "/clients"]) {
  console.log(path);
  console.log("   identity : " + (await tryFetch(path, null, 25000)));
  console.log("   gzip     : " + (await tryFetch(path, "gzip", 25000)));
  console.log("   br       : " + (await tryFetch(path, "br", 25000)));
}
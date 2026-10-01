const BASE = "http://localhost:3000";

for (const path of ["/", "/products", "/clients", "/products/office-storage"]) {
  const times = [];
  for (let i = 0; i < 3; i++) {
    const t0 = Date.now();
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 40000);
    let out;
    try {
      const res = await fetch(BASE + path, { signal: ac.signal, headers: { "accept-encoding": "identity" } });
      const reader = res.body.getReader();
      let bytes = 0;
      let ttfb = null;
      let chunks = 0;
      let lastAt = 0;
      let gap = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const now = Date.now() - t0;
        if (ttfb === null) ttfb = now;
        if (chunks > 0) gap = Math.max(gap, now - lastAt);
        lastAt = now;
        chunks++;
        bytes += value.length;
      }
      out = `OK ${String(Math.round(bytes/1024)).padStart(4)}KB ttfb=${ttfb}ms total=${Date.now()-t0}ms chunks=${chunks} maxGap=${gap}ms`;
    } catch (e) {
      out = `FAIL ${e.name} after ${Date.now() - t0}ms`;
    }
    clearTimeout(to);
    times.push(out);
  }
  console.log(path.padEnd(28) + times.join("  |  "));
}
const BASE = "http://localhost:3000";
const paths = ["/", "/products", "/clients", "/contact", "/admin"];

for (const p of paths) {
  const t0 = Date.now();
  const res = await fetch(BASE + p, { headers: { "accept-encoding": "gzip, br" } });
  const reader = res.body.getReader();
  let bytes = 0;
  let firstByte = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (firstByte === null) firstByte = Date.now() - t0;
    bytes += value.length;
  }
  const total = Date.now() - t0;
  console.log(
    p.padEnd(12) +
      " status=" + res.status +
      " ttfb=" + firstByte + "ms" +
      " total=" + total + "ms" +
      " bytes=" + (bytes / 1024).toFixed(0) + "KB" +
      " enc=" + (res.headers.get("content-encoding") || "none") +
      " len=" + (res.headers.get("content-length") || "chunked"),
  );
}
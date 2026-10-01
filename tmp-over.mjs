import { chromium } from "playwright";
const b = await chromium.launch();
for (const w of [320, 430]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 800 } })).newPage();
  await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 180000 });
  await p.waitForTimeout(3000);
  const r = await p.evaluate(() => {
    const sec = document.querySelector("#why-rack-stack");
    const vw = document.documentElement.clientWidth;
    const list = [];
    for (const el of sec.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > vw + 1 || r.left < -1)) {
        // is any ancestor clipping it?
        let clipped = false, n = el.parentElement;
        while (n) { const s = getComputedStyle(n); if (/hidden|clip/.test(s.overflowX) || /hidden|clip/.test(s.overflow)) { clipped = true; break; } n = n.parentElement; }
        list.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} [${Math.round(r.left)}..${Math.round(r.right)}] clippedByAncestor=${clipped}`);
      }
    }
    const map = sec.querySelector(".india-map");
    return { list, pageScrollW: document.documentElement.scrollWidth, vw, mapOk: map.complete && map.naturalWidth > 0, mapW: Math.round(map.getBoundingClientRect().width) };
  });
  console.log(`--- ${w}px --- pageScrollWidth=${r.pageScrollW} viewport=${r.vw} ${r.pageScrollW <= r.vw + 1 ? "NO HORIZONTAL PAGE SCROLL" : "*** PAGE OVERFLOWS ***"}`);
  console.log(`  india-map loaded=${r.mapOk} width=${r.mapW}`);
  for (const l of r.list) console.log("  overflow:", l);
  await p.context().close();
}
await b.close();
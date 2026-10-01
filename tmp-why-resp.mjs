import { chromium } from "playwright";

const b = await chromium.launch();
for (const w of [320, 375, 390, 414, 430, 768, 810, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
  const p = await ctx.newPage();
  await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 180000 });
  await p.waitForTimeout(1800);
  const r = await p.evaluate(() => {
    const sec = document.querySelector("#why-rack-stack");
    const sr = sec.getBoundingClientRect();
    const btn = sec.querySelector(".btn-accent");
    const br = btn.getBoundingClientRect();
    const ico = sec.querySelector(".rounded-lg.bg-\\[color\\:var\\(--red\\)\\]\\/10");
    const imgs = [...sec.querySelectorAll("img")].map((i) => ({ w: Math.round(i.getBoundingClientRect().width), ok: i.complete && i.naturalWidth > 0 }));
    const col = [...sec.querySelectorAll(".grid.grid-cols-3 > a, .grid.grid-cols-2 > div, .grid.grid-cols-1 > div")].length;
    const vw = document.documentElement.clientWidth;
    let over = 0;
    for (const el of sec.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > vw + 1 || r.left < -1)) over++;
    }
    return {
      secW: Math.round(sr.width), secH: Math.round(sr.height), bg: getComputedStyle(sec).backgroundColor,
      bgImg: getComputedStyle(sec).backgroundImage,
      btnBox: `${Math.round(br.width)}x${Math.round(br.height)}`, btnBg: getComputedStyle(btn).backgroundColor,
      iconVisible: !!ico && getComputedStyle(ico).display !== "none",
      imgs, cards: col, overflowEls: over,
      h2Font: getComputedStyle(sec.querySelector("h2")).fontSize,
    };
  });
  console.log(`${String(w).padStart(4)}px  sec=${r.secW}x${r.secH} bg=${r.bg} bgImg=${r.bgImg === "none" ? "none" : "IMAGE!"}  btn=${r.btnBox} btnBg=${r.btnBg} icon=${r.iconVisible} imgs=[${r.imgs.map((i) => i.w + (i.ok ? "" : "!!")).join(",")}] cards=${r.cards} h2=${r.h2Font} overflowEls=${r.overflowEls}`);
  await ctx.close();
}
await b.close();
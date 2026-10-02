import { chromium } from "playwright";
const EMAIL = process.env.ADMIN_EMAIL!, PASS = process.env.ADMIN_PASSWORD!;
const browser = await chromium.launch({ args: ["--no-sandbox","--disable-dev-shm-usage","--disable-gpu"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(45000);
await page.goto("http://localhost:3150/admin/login", { waitUntil: "commit", timeout: 45000 });
await page.waitForTimeout(6000);
await page.fill('input[name="email"]', EMAIL);
await page.fill('input[name="password"]', PASS);
await page.getByRole("button", { name: "Secure sign in" }).click();
await page.waitForTimeout(8000);
const cookies = await ctx.cookies();
console.log("cookies:", cookies.map(c => `${c.name}(httpOnly=${c.httpOnly}, secure=${c.secure})`).join(", "));
console.log("url after login:", page.url());
await page.goto("http://localhost:3150/admin/settings", { waitUntil: "commit", timeout: 45000 });
await page.waitForTimeout(5000);
console.log("settings url:", page.url());
console.log("page text:", (await page.locator("body").innerText()).replace(/\s+/g," ").slice(0,400));
for (const [l,n] of [["Instagram","socialInstagram"],["LinkedIn","socialLinkedin"],["Facebook","socialFacebook"],["Google","socialGoogle"]] as const) {
  console.log(`  ${l} count=${await page.locator(`[name="${n}"]`).count()}`);
}
await browser.close();

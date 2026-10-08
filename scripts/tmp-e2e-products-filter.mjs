/** TEMPORARY — end-to-end check of the /products filter behaviour in a real browser. */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3111";
let failures = 0;

const pass = (label) => console.log(`PASS  ${label}`);
const fail = (label, detail) => {
  failures += 1;
  console.log(`FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
};

async function readState(page) {
  return page.evaluate(() => {
    const cards = document.querySelectorAll("#catalogue-results article").length;
    const status = document.querySelector('p[role="status"]')?.innerText ?? "";
    const match = status.match(/Showing\s+(\d+)\s+of\s+(\d+)/);
    const empty = Boolean(document.body.innerText.includes("No products match these filters"));
    return {
      cards,
      shown: match ? Number(match[1]) : null,
      total: match ? Number(match[2]) : null,
      empty,
    };
  });
}

async function waitForCount(page, expected, label) {
  const deadline = Date.now() + 20000;
  let last;
  while (Date.now() < deadline) {
    last = await readState(page);
    const ok =
      expected === 0
        ? last.empty && last.shown === 0
        : !last.empty && last.cards === expected && last.shown === expected;
    if (ok) {
      pass(`${label} => ${expected}`);
      return last;
    }
    await page.waitForTimeout(250);
  }
  fail(`${label} => ${expected}`, `last state ${JSON.stringify(last)}`);
  return last;
}

async function selectOption(page, label, matcher) {
  await page.getByLabel(label, { exact: true }).selectOption(matcher);
  await page.waitForTimeout(200);
}

const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (error) => fail("no page error", String(error)));

try {
  // 1. Initial load.
  await page.goto(`${BASE}/products`, { waitUntil: "networkidle" });
  await page.locator("#catalogue").scrollIntoViewIfNeeded();
  let state = await waitForCount(page, 37, "initial render");
  if (state.total !== 37) fail("status total", `total was ${state.total}`);

  // 2. Category filter.
  await selectOption(page, "Category", "industrial-storage");
  state = await waitForCount(page, 9, "category=industrial-storage");
  await selectOption(page, "Category", "all");
  await waitForCount(page, 37, "category back to All categories");

  // Every category option in turn.
  const categoryValues = await page
    .getByLabel("Category", { exact: true })
    .locator("option")
    .evaluateAll((options) => options.map((o) => o.value));
  for (const value of categoryValues) {
    if (value === "all") continue;
    await selectOption(page, "Category", value);
    state = await readState(page);
    if (state.shown > 0 && state.shown < 37 && state.cards === state.shown) {
      pass(`category=${value} => ${state.shown}`);
    } else {
      fail(`category=${value}`, JSON.stringify(state));
    }
  }
  await selectOption(page, "Category", "all");
  await waitForCount(page, 37, "all categories restored");

  // 3. Application / Industry / Product type: pick the first real option, then clear.
  for (const [label, allValue] of [
    ["Application", "all"],
    ["Industry", "all"],
    ["Product type", "all"],
  ]) {
    const values = await page
      .getByLabel(label, { exact: true })
      .locator("option")
      .evaluateAll((options) => options.map((o) => o.value));
    const real = values.filter((value) => value !== allValue);
    for (const value of real) {
      await selectOption(page, label, value);
      state = await readState(page);
      if (state.shown > 0 && state.shown < 37 && state.cards === state.shown) {
        pass(`${label}="${value}" => ${state.shown}`);
      } else {
        fail(`${label}="${value}"`, JSON.stringify(state));
      }
    }
    await selectOption(page, label, allValue);
    await waitForCount(page, 37, `${label} cleared`);
  }

  // 4. Featured only.
  await page.getByLabel("Featured only").check();
  state = await readState(page);
  if (state.shown > 0 && state.shown < 37 && state.cards === state.shown) {
    pass(`Featured only => ${state.shown}`);
  } else {
    fail("Featured only", JSON.stringify(state));
  }
  await page.getByLabel("Featured only").uncheck();
  await waitForCount(page, 37, "Featured only off");

  // 5. Search.
  await page.getByLabel("Search products").fill("pallet");
  state = await readState(page);
  if (state.shown > 0 && state.shown < 37) pass(`search "pallet" => ${state.shown}`);
  else fail(`search "pallet"`, JSON.stringify(state));
  await page.getByLabel("Search products").fill("");
  await waitForCount(page, 37, "search cleared");

  // 6. Empty state, then Clear filters restores everything.
  await page.getByLabel("Search products").fill("zzzz-no-such-product");
  state = await waitForCount(page, 0, "no-match search shows empty state");
  const clearButton = page.getByRole("button", { name: /clear filters/i });
  if (await clearButton.isVisible()) pass("Clear filters button visible");
  else fail("Clear filters button visible");
  await clearButton.click();
  await waitForCount(page, 37, "Clear filters restores complete catalogue");

  // 7. Combined filters, then clear.
  await selectOption(page, "Category", "office-storage");
  await selectOption(page, "Industry", "Office & Corporate");
  await page.getByLabel("Featured only").check();
  state = await readState(page);
  if (state.shown >= 0 && state.shown < 37) pass(`combined filters => ${state.shown}`);
  else fail("combined filters", JSON.stringify(state));
  await page.getByLabel("Featured only").uncheck();
  await selectOption(page, "Industry", "all");
  await selectOption(page, "Category", "all");
  await waitForCount(page, 37, "combined filters cleared");

  // 8. Sorting keeps the whole set.
  await selectOption(page, "Sort products", "az");
  await waitForCount(page, 37, "A-Z sort keeps all products");
  const names = await page.locator("#catalogue-results h2").allInnerTexts();
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  if (JSON.stringify(names) === JSON.stringify(sorted)) pass("A-Z order applied");
  else fail("A-Z order applied", `${names.slice(0, 3).join(" | ")}`);
  await selectOption(page, "Sort products", "featured");
  await waitForCount(page, 37, "Featured sort restored");

  // 9. Deep link still narrows on arrival, and a plain visit shows everything.
  await page.goto(`${BASE}/products?category=material-handling`, { waitUntil: "networkidle" });
  await page.locator("#catalogue").scrollIntoViewIfNeeded();
  await waitForCount(page, 14, "?category=material-handling deep link");
  await page.goto(`${BASE}/products`, { waitUntil: "networkidle" });
  await page.locator("#catalogue").scrollIntoViewIfNeeded();
  await waitForCount(page, 37, "plain /products after deep link");
} catch (error) {
  fail("script error", String(error));
} finally {
  await browser.close();
}

console.log(failures === 0 ? "\nALL BROWSER CHECKS PASSED" : `\n${failures} BROWSER CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);

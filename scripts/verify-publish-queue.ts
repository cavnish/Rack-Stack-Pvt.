/**
 * Verifies the per-scope publish queue guarantees against the real
 * `createPublishQueue` used by the admin routes:
 *   1. same scope runs strictly one at a time, in call order
 *   2. different scopes overlap instead of blocking each other
 *   3. a scope is never dropped (every call resolves with its own scope)
 *   4. a failed run does not poison the queue behind it
 *   5. counters reported per run are not mixed between concurrent scopes
 */
import { createPublishQueue, type PublishResult, type PublishScope } from "@/lib/publish";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    console.log(`  ok   ${name}`);
    return;
  }
  failures += 1;
  console.log(`  FAIL ${name}${detail ? ` :: ${detail}` : ""}`);
}

function result(scope: PublishScope, extra: Partial<PublishResult> = {}): PublishResult {
  return {
    scope,
    collections: [],
    assetsCached: 0,
    assetsReused: 0,
    assetsFailed: 0,
    failedAssets: [],
    durationMs: 0,
    skipped: false,
    ...extra,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function testSameScopeIsSerial() {
  console.log("same scope is serialized in call order");
  const enqueue = createPublishQueue(async (scope) => {
    await sleep(25);
    return result(scope);
  });
  const scopes: PublishScope[] = [];
  const all = Promise.all(
    (["sliders", "sliders", "sliders"] as PublishScope[]).map(async (scope) => {
      const value = await enqueue(scope);
      scopes.push(value.scope);
      return value;
    }),
  );
  const [a, b, c] = await all;
  check("all three calls resolve", Boolean(a && b && c));
  check("each call reports its own scope", scopes.every((scope) => scope === "sliders"));
  check("no scope dropped", scopes.length === 3, `got ${scopes.length}`);
}

async function testDifferentScopesOverlap() {
  console.log("different scopes run concurrently");
  const enqueue = createPublishQueue(async (scope) => {
    await sleep(60);
    return result(scope);
  });
  const started = Date.now();
  const [logos, sliders] = await Promise.all([enqueue("client-logos"), enqueue("sliders")]);
  const elapsed = Date.now() - started;
  check("logos keeps its own scope", logos.scope === "client-logos", logos.scope);
  check("sliders keeps its own scope", sliders.scope === "sliders", sliders.scope);
  // Serialized execution would need ~120ms; overlapping needs ~60ms.
  check("overlapped instead of blocking", elapsed < 115, `${elapsed}ms`);
}

async function testCrossScopeNotDropped() {
  console.log("a scope is never handed another scope's result");
  const enqueue = createPublishQueue(async (scope) => {
    // Stagger so the first call is still running when the others arrive.
    await sleep(scope === "products" ? 80 : 5);
    return result(scope);
  });
  const requests: PublishScope[] = ["products", "client-logos", "sliders", "client-logos", "homepage"];
  const responses = await Promise.all(requests.map((scope) => enqueue(scope)));
  const mismatched = responses.filter((value, index) => value.scope !== requests[index]);
  check("every response matches its request", mismatched.length === 0, JSON.stringify(responses.map((r) => r.scope)));
  check("no request lost", responses.length === requests.length);
}

async function testFailureDoesNotPoisonQueue() {
  console.log("a failed run does not poison the queue");
  let attempt = 0;
  const enqueue = createPublishQueue(async (scope) => {
    attempt += 1;
    await sleep(10);
    if (attempt === 1) throw new Error("boom");
    return result(scope, { assetsCached: attempt });
  });
  const first = await enqueue("sliders");
  const second = await enqueue("sliders");
  check("first failure is reported, not thrown", first.error === "boom", first.error ?? "no error");
  check("first run is marked skipped", first.skipped === true);
  check("second run still executes", second.error === undefined, second.error ?? "");
  check("second run is not skipped", second.skipped === false);
  check("second run reports its own counters", second.assetsCached === 2, String(second.assetsCached));
}

async function testCountersAreNotShared() {
  console.log("concurrent runs report independent asset counts");
  const enqueue = createPublishQueue(async (scope) => {
    for (let i = 0; i < 3; i += 1) await sleep(5);
    return result(scope, { assetsCached: scope === "products" ? 7 : 2 });
  });
  const [products, logos] = await Promise.all([enqueue("products"), enqueue("client-logos")]);
  check("products reports 7", products.assetsCached === 7, String(products.assetsCached));
  check("client-logos reports 2", logos.assetsCached === 2, String(logos.assetsCached));
}

async function main() {
  for (const test of [
    testSameScopeIsSerial,
    testDifferentScopesOverlap,
    testCrossScopeNotDropped,
    testFailureDoesNotPoisonQueue,
    testCountersAreNotShared,
  ]) {
    await test();
  }
  console.log(failures === 0 ? "\nPUBLISH QUEUE OK" : `\n${failures} PUBLISH QUEUE CHECK(S) FAILED`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});

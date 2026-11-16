const { test, describe, before } = require("node:test");
const assert = require("node:assert");

// Cache behaviour is only exercised in "disabled" mode here. A live MongoDB
// round-trip is covered by the deployment smoke test, which needs a real URI.
describe("MongoDB cache (disabled without MONGODB_URI)", () => {
  let cache;

  before(() => {
    delete process.env.MONGODB_URI;
    cache = require("../services/cache");
  });

  test("getCachedStats returns null when caching is disabled", async () => {
    assert.strictEqual(await cache.getCachedStats("octocat"), null);
  });

  test("getStaleCachedStats returns null when caching is disabled", async () => {
    assert.strictEqual(await cache.getStaleCachedStats("octocat"), null);
  });

  test("setCachedStats is a no-op when caching is disabled", async () => {
    await assert.doesNotReject(() =>
      cache.setCachedStats("octocat", { repos: 1 }),
    );
  });

  test("non-string usernames do not throw", async () => {
    assert.strictEqual(await cache.getCachedStats(["a", "b"]), null);
  });

  test("closeCache is safe when never connected", async () => {
    await assert.doesNotReject(() => cache.closeCache());
  });
});

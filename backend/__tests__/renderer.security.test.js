/**
 * Regression tests for the SVG injection fix (issue #31).
 *
 * Each of the three injection contexts reported there is asserted to be
 * neutralised, alongside tests that legitimate input still renders correctly —
 * a fix that broke normal cards would be no fix at all.
 *
 * Uses node:test so the project gains coverage without a new dependency.
 */

const test = require("node:test");
const assert = require("node:assert/strict");

const { renderCard } = require("../services/renderer");

const STATS = {
  username: "octocat",
  name: "The Octocat",
  bio: "A friendly cat",
  repos: 8,
  stars: 42,
  forks: 3,
  followers: 100,
  following: 5,
  commits: 500,
  prs: 20,
  issues: 10,
  reviews: 7,
  longest_streak: 12,
  current_streak: 4,
  languages: [{ name: "JavaScript", pct: 62.5, color: "#f1e05a" }],
};

/** Nothing user-supplied may ever introduce an executable element. */
function assertNoScript(svg) {
  assert.equal(/<script/i.test(svg), false, "rendered SVG must not contain a <script> element");
}

// ---------------------------------------------------------------- injection

test("heart_N_animation cannot inject markup (bare element position)", () => {
  const svg = renderCard("5", STATS, {
    heart_1_animation: "<script>MARKER</script>",
  });
  assertNoScript(svg);
  assert.equal(svg.includes("MARKER"), false, "payload must not survive at all");
});

test("heart_N_animation falls back to no animation for unknown values", () => {
  const svg = renderCard("5", STATS, { heart_1_animation: "not-a-real-key" });
  assertNoScript(svg);
  assert.equal(svg.includes("not-a-real-key"), false);
});

test("heart_N_fill cannot break out of its attribute", () => {
  const svg = renderCard("5", STATS, {
    heart_1_fill: 'red" onload="MARKER',
  });
  assert.equal(/onload/i.test(svg), false, "must not inject an event handler");
  assert.equal(svg.includes("MARKER"), false);
});

test("quote_N_text cannot break out of its text node", () => {
  const svg = renderCard("5", STATS, {
    quote_1_text: "</tspan><script>MARKER</script><tspan>",
  });
  assertNoScript(svg);
  assert.ok(svg.includes("&lt;/tspan&gt;"), "payload should appear escaped, as visible text");
});

test("Card 1 identity fields are escaped", () => {
  const svg = renderCard("1", STATS, {
    name: "<script>MARKER</script>",
    bio: '"><script>MARKER</script>',
    value_1: "<img onerror=MARKER>",
  });
  assertNoScript(svg);
  // The payload may appear as visible text; what matters is that it is escaped
  // and therefore inert, not that the substring is absent.
  assert.ok(svg.includes("&lt;img onerror=MARKER&gt;"), "payload must be escaped, not live markup");
  assert.equal(/<img\s/i.test(svg), false, "must not produce a real <img> element");
});

test("GitHub-sourced name and bio are escaped, not just query overrides", () => {
  // A GitHub user controls their own profile fields, so these are untrusted too.
  const hostile = { ...STATS, name: "<script>MARKER</script>", bio: "<b>bold</b>" };
  const svg = renderCard("1", hostile);
  assertNoScript(svg);
  assert.ok(svg.includes("&lt;b&gt;bold&lt;/b&gt;"));
});

test("a value cannot smuggle in another token for a later pass (second-order)", () => {
  // Sequential substitution would have expanded this on a later iteration.
  const count = (svg) => (svg.match(/<animateTransform/g) || []).length;
  const baseline = renderCard("5", STATS, {
    quote_1_text: "plain text",
    heart_1_animation: "pulse",
  });
  const smuggled = renderCard("5", STATS, {
    quote_1_text: "{{heart_1_animation}}",
    heart_1_animation: "pulse",
  });
  assert.equal(
    count(smuggled),
    count(baseline),
    "a token smuggled through a value must not be expanded on a later pass",
  );
});

// ------------------------------------------------------------- still works

test("allowlisted animation keys render their markup", () => {
  const pulse = renderCard("5", STATS, { heart_1_animation: "pulse" });
  assert.ok(pulse.includes("<animateTransform"), "pulse should render an animateTransform");

  const blink = renderCard("5", STATS, { heart_1_animation: "blink" });
  assert.ok(blink.includes("values='1;0;1'"), "blink should render its opacity animation");

  // The card's quote cycle uses its own <animate> elements, so scope this to
  // the animation the heart tokens control.
  const none = renderCard("5", STATS, { heart_1_animation: "none" });
  assert.equal(
    (none.match(/<animateTransform/g) || []).length,
    (renderCard("5", STATS).match(/<animateTransform/g) || []).length,
    "none should add no heart animation beyond the template baseline",
  );
});

test("previously-sent raw markup still maps to the right animation (rollout safety)", () => {
  const legacy =
    "<animateTransform attributeName='transform' type='scale' values='1;1.08;1' dur='1.2s' repeatCount='indefinite'/>";
  const svg = renderCard("5", STATS, { heart_1_animation: legacy });
  assert.ok(svg.includes("<animateTransform"), "legacy markup should resolve to pulse");
});

test("valid hex colours pass through; invalid ones fall back", () => {
  assert.ok(renderCard("5", STATS, { heart_1_fill: "#ff1744" }).includes("#ff1744"));
  const bad = renderCard("5", STATS, { heart_1_fill: "javascript:alert(1)" });
  assert.equal(bad.includes("javascript"), false);
  assert.ok(bad.includes("#1a1a2e"), "should fall back to the default fill");
});

test("ordinary text renders as-is", () => {
  const svg = renderCard("5", STATS, { quote_1_text: "Ship it." });
  assert.ok(svg.includes("Ship it."));
});

test("ampersands are escaped exactly once", () => {
  const svg = renderCard("5", STATS, { quote_1_text: "Tom & Jerry" });
  assert.ok(svg.includes("Tom &amp; Jerry"));
  assert.equal(svg.includes("&amp;amp;"), false, "must not double-escape");
});

test("every card renders with no unsubstituted tokens left behind", () => {
  for (const id of ["1", "2", "3", "4", "5"]) {
    const svg = renderCard(id, STATS);
    // Templates document their own tokens inside XML comments (using a literal
    // "N" placeholder), which are not render slots — strip comments first.
    const body = svg.replace(/<!--[\s\S]*?-->/g, "");
    // Pre-existing (unchanged by this PR): card 1's template references three
    // tokens that buildTokenMap has never populated, so they render literally.
    // Tracked separately; asserted here so the set cannot grow unnoticed.
    const KNOWN_UNPOPULATED = new Set(["location", "company", "created_at"]);
    const leftover = (body.match(/\{\{(\w+)\}\}/g) || []).filter(
      (t) => !KNOWN_UNPOPULATED.has(t.slice(2, -2)),
    );
    assert.deepEqual(leftover, [], `card ${id} left unexpected tokens: ${leftover}`);
    assertNoScript(svg);
  }
});

test("an unknown card id throws", () => {
  assert.throws(() => renderCard("99", STATS), /not found/i);
});

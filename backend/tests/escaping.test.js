const { test, describe } = require("node:test");
const assert = require("node:assert");
const { renderCard, buildTokenMap, escapeXml } = require("../services/renderer");

const baseData = {
  name: "Octocat",
  username: "octocat",
  bio: "",
  repos: 1,
  stars: 2,
  forks: 3,
  followers: 4,
  following: 5,
  commits: 6,
  prs: 7,
  issues: 8,
  reviews: 9,
  longest_streak: 10,
  current_streak: 11,
  languages: [],
};

describe("XML escaping", () => {
  test("escapeXml encodes all XML special characters", () => {
    assert.strictEqual(
      escapeXml(`A & B <tag> "quoted" it's`),
      "A &amp; B &lt;tag&gt; &quot;quoted&quot; it&apos;s",
    );
    assert.strictEqual(escapeXml(null), "");
    assert.strictEqual(escapeXml(undefined), "");
  });

  test("Card 1 escapes a bio containing & and <> instead of breaking the SVG", () => {
    const svg = renderCard("1", {
      ...baseData,
      name: "A & B <x>",
      bio: "AI & Systems <3",
    });

    assert.ok(svg.includes("A &amp; B &lt;x&gt;"), "name should be escaped");
    assert.ok(svg.includes("AI &amp; Systems &lt;3"), "bio should be escaped");
    assert.ok(!svg.includes("AI & Systems <3"), "raw bio must not leak");
    assert.ok(!svg.includes("<script>"), "no raw markup from user text");
  });

  test("Card 5 escapes quote overrides", () => {
    const svg = renderCard(
      "5",
      baseData,
      { quote_1_text: 'Ship "it" & <forget> it' },
    );

    assert.ok(
      svg.includes("Ship &quot;it&quot; &amp; &lt;forget&gt; it"),
      "quote should be escaped",
    );
  });

  test("Card 4 escapes language names", () => {
    const svg = renderCard("4", {
      ...baseData,
      languages: [{ name: "C & C++", color: "#123456", pct: 100 }],
    });

    assert.ok(svg.includes("C &amp; C++"), "language name should be escaped");
  });

  test("literal $& in user text is not interpreted as a replacement pattern", () => {
    const svg = renderCard("1", {
      ...baseData,
      name: "Price $& Deal",
    });

    // $ is literal, & gets escaped -> "$&amp;". The old string-replacement
    // implementation would have substituted the matched {{name}} token here.
    assert.ok(svg.includes("Price $&amp; Deal"));
    assert.ok(!svg.includes("{{name}}"), "token must be fully replaced");
  });

  test("an explicit empty override clears a field instead of falling back", () => {
    const map = buildTokenMap(
      { ...baseData, bio: "from github" },
      { bio: "" },
    );
    assert.strictEqual(map.bio, "");
  });

  test("card 5 applies a known heart_2_animation value", () => {
    const pulse =
      "<animateTransform attributeName='transform' type='scale' values='1;1.08;1' dur='1.2s' repeatCount='indefinite'/>";
    const svg = renderCard("5", baseData, { heart_2_animation: pulse });
    assert.ok(
      svg.includes("animateTransform"),
      "heart 2 animation override must reach the SVG",
    );
  });

  test("card 5 drops unknown heart animation markup", () => {
    const svg = renderCard("5", baseData, {
      heart_2_animation: "<script>alert(1)</script>",
    });
    assert.ok(!svg.includes("<script>"), "arbitrary markup must be rejected");
    assert.ok(!svg.includes("alert(1)"), "unsafe value must not survive");
    assert.ok(
      svg.includes("animate attributeName=\"opacity\""),
      "invalid value falls back to the heart 2 default blink",
    );
  });

  test("all cards render without unresolved tokens", () => {
    for (const id of ["1", "2", "3", "4", "5"]) {
      const svg = renderCard(id, baseData, {});
      assert.ok(!svg.includes("{{"), `card ${id} left a {{token}} behind`);
    }
  });
});

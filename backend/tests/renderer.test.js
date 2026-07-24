const { test, describe } = require("node:test");
const assert = require("node:assert");
const { renderCard, buildTokenMap } = require("../services/renderer");

describe("Renderer Service Core Utilities", () => {
  const sampleData = {
    name: "Octocat",
    username: "octocat",
    bio: "Building cool projects",
    repos: 42,
    stars: 120,
    forks: 15,
    followers: 250,
    following: 10,
    commits: 350,
    prs: 25,
    issues: 5,
    reviews: 12,
    longest_streak: 14,
    current_streak: 5,
    languages: [
      { name: "JavaScript", color: "#f1e05a", pct: 60.0 },
      { name: "TypeScript", color: "#3178c6", pct: 40.0 },
    ],
  };

  describe("buildTokenMap", () => {
    test("populates default token values accurately", () => {
      const map = buildTokenMap(sampleData);

      assert.strictEqual(map.username, "octocat");
      assert.strictEqual(map.repos, "42");
      assert.strictEqual(map.stars, "120");
      assert.strictEqual(map.commits, "350");
      assert.strictEqual(map.lang_1_name, "JavaScript");
      assert.strictEqual(map.lang_1_pct, "60.0");
      assert.strictEqual(map.lang_2_name, "TypeScript");
      assert.strictEqual(map.lang_3_name, "—"); // Fallback for unused slot
    });

    test("applies parameter overrides correctly", () => {
      const overrides = {
        name: "Custom Name",
        field_1: "TWITTER",
        value_1: "@octocat",
      };

      const map = buildTokenMap(sampleData, overrides);

      assert.strictEqual(map.name, "Custom Name");
      assert.strictEqual(map.field_1, "TWITTER");
      assert.strictEqual(map.value_1, "@octocat");
    });
  });

  describe("renderCard", () => {
    test("renders SVG string for Card 1 (Identity)", () => {
      const svg = renderCard("1", sampleData);

      assert.ok(svg.includes("<svg"));
      assert.ok(svg.includes("Octocat"));
      assert.ok(svg.includes("building-cool-projects") || svg.includes("Building cool projects") || svg.includes("octocat"));
    });

    test("renders SVG string for Card 2 (Stats)", () => {
      const svg = renderCard("2", sampleData);

      assert.ok(svg.includes("<svg"));
      assert.ok(svg.includes("42")); // repos
      assert.ok(svg.includes("120")); // stars
    });

    test("renders SVG string for Card 3 (Quest Log)", () => {
      const svg = renderCard("3", sampleData);

      assert.ok(svg.includes("<svg"));
      assert.ok(svg.includes("350")); // commits
      assert.ok(svg.includes("14")); // longest streak
    });

    test("renders SVG string for Card 4 (Tech Stack)", () => {
      const svg = renderCard("4", sampleData);

      assert.ok(svg.includes("<svg"));
      assert.ok(svg.includes("JavaScript"));
      assert.ok(svg.includes("TypeScript"));
    });

    test("renders SVG string for Card 5 (Footer)", () => {
      const svg = renderCard("5", sampleData);

      assert.ok(svg.includes("<svg"));
    });

    test("throws error when invalid card ID is provided", () => {
      assert.throws(
        () => renderCard("99", sampleData),
        /Template for Card ID 99 not found/,
      );
    });
  });
});

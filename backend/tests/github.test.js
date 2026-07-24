const { test, describe } = require("node:test");
const assert = require("node:assert");
const { calculateStreaks, aggregateLanguages } = require("../services/github");

describe("GitHub Service Core Utilities", () => {
  describe("calculateStreaks", () => {
    test("calculates current and longest streak correctly for continuous days", () => {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const dayBefore = new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0];

      const weeks = [
        {
          contributionDays: [
            { date: dayBefore, contributionCount: 3 },
            { date: yesterday, contributionCount: 5 },
            { date: today, contributionCount: 2 },
          ],
        },
      ];

      const result = calculateStreaks(weeks);

      assert.strictEqual(result.currentStreak, 3);
      assert.strictEqual(result.longestStreak, 3);
    });

    test("handles broken streaks and identifies historical longest streak", () => {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      const weeks = [
        {
          contributionDays: [
            { date: "2024-01-01", contributionCount: 1 },
            { date: "2024-01-02", contributionCount: 4 },
            { date: "2024-01-03", contributionCount: 2 },
            { date: "2024-01-04", contributionCount: 5 },
            { date: "2024-01-05", contributionCount: 0 }, // Streak broken
            { date: yesterday, contributionCount: 1 },
            { date: today, contributionCount: 2 },
          ],
        },
      ];

      const result = calculateStreaks(weeks);

      assert.strictEqual(result.longestStreak, 4);
      assert.strictEqual(result.currentStreak, 2);
    });
  });

  describe("aggregateLanguages", () => {
    test("aggregates, calculates percentages, and sorts top 5 languages", () => {
      const repos = [
        {
          languages: {
            edges: [
              { size: 600, node: { name: "JavaScript", color: "#f1e05a" } },
              { size: 300, node: { name: "TypeScript", color: "#3178c6" } },
            ],
          },
        },
        {
          languages: {
            edges: [
              { size: 100, node: { name: "HTML", color: "#e34c26" } },
              { size: 400, node: { name: "JavaScript", color: "#f1e05a" } },
            ],
          },
        },
      ];

      const languages = aggregateLanguages(repos);

      assert.strictEqual(languages.length, 3);
      // Total size = 1400 (JavaScript: 1000, TypeScript: 300, HTML: 100)
      assert.strictEqual(languages[0].name, "JavaScript");
      assert.strictEqual(languages[0].pct.toFixed(1), "71.4");
      assert.strictEqual(languages[1].name, "TypeScript");
      assert.strictEqual(languages[1].pct.toFixed(1), "21.4");
      assert.strictEqual(languages[2].name, "HTML");
    });

    test("returns an empty array when repos have no language data", () => {
      const repos = [{ languages: { edges: [] } }];
      const languages = aggregateLanguages(repos);

      assert.deepStrictEqual(languages, []);
    });
  });
});

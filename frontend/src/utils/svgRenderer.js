/**
 * Replaces all {{token}} placeholders in an SVG string.
 * Accepts a flat key-value map where keys match token names.
 */
export function replaceSvgTokens(svgTemplate, tokenMap) {
  if (!svgTemplate || !tokenMap) return svgTemplate;

  let rendered = svgTemplate;
  for (const [key, value] of Object.entries(tokenMap)) {
    rendered = rendered.replaceAll(`{{${key}}}`, String(value));
  }
  return rendered;
}

/**
 * Builds a flat token map from GitHub stats data (for Cards 2, 3, 4).
 */
export function buildStatsTokenMap(data) {
  if (!data) return {};

  const map = {
    // Card 2
    repos: String(data.repos ?? 0),
    stars: String(data.stars ?? 0),
    forks: String(data.forks ?? 0),
    followers: String(data.followers ?? 0),
    following: String(data.following ?? 0),
    // Card 3
    commits: String(data.commits ?? 0),
    prs: String(data.prs ?? 0),
    issues: String(data.issues ?? 0),
    reviews: String(data.reviews ?? 0),
    longest: String(data.longest_streak ?? 0),
    current: String(data.current_streak ?? 0),
  };

  // Card 4 — Languages defaults
  for (let i = 1; i <= 5; i++) {
    map[`lang_${i}_name`] = "—";
    map[`lang_${i}_pct`] = "0.0";
    map[`lang_${i}_color`] = "#1a1a2e";
    map[`lang_${i}_dashoffset`] = "440";
  }

  if (data.languages && Array.isArray(data.languages)) {
    data.languages.forEach((lang, index) => {
      const n = index + 1;
      if (n <= 5) {
        map[`lang_${n}_name`] = lang.name;
        map[`lang_${n}_pct`] =
          typeof lang.pct === "number" ? lang.pct.toFixed(1) : String(lang.pct);
        map[`lang_${n}_color`] = lang.color;
        const barWidth = Math.round(((lang.pct || 0) / 100) * 440);
        map[`lang_${n}_dashoffset`] = String(440 - barWidth);
      }
    });
  }

  return map;
}

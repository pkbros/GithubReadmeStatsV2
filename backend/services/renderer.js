const fs = require("fs");
const path = require("path");

const templates = {};
const templatesDir = path.join(__dirname, "../templates");

function loadTemplates() {
  try {
    templates["1"] = fs.readFileSync(
      path.join(templatesDir, "card1-identity.svg"),
      "utf8",
    );
    templates["2"] = fs.readFileSync(
      path.join(templatesDir, "card2-stats.svg"),
      "utf8",
    );
    templates["3"] = fs.readFileSync(
      path.join(templatesDir, "card3-quest-log.svg"),
      "utf8",
    );
    templates["4"] = fs.readFileSync(
      path.join(templatesDir, "card4-tech-stack.svg"),
      "utf8",
    );
    templates["5"] = fs.readFileSync(
      path.join(templatesDir, "card5-footer.svg"),
      "utf8",
    );
    console.log("SVG templates loaded successfully.");
  } catch (error) {
    console.error("Error loading SVG templates:", error.message);
  }
}

loadTemplates();

function buildTokenMap(data, overrides = {}) {
  const map = {
    // Card 1 — Identity
    name: overrides.name || data.name || data.username || "",
    username: data.username || "",
    bio: overrides.bio || data.bio || "",
    field_1: overrides.field_1 || "EMAIL",
    value_1: overrides.value_1 || "",
    field_2: overrides.field_2 || "LINKEDIN",
    value_2: overrides.value_2 || "",
    field_3: overrides.field_3 || "STATUS",
    value_3: overrides.value_3 || "",

    // Card 2 — Stats
    repos: String(data.repos || 0),
    stars: String(data.stars || 0),
    forks: String(data.forks || 0),
    followers: String(data.followers || 0),
    following: String(data.following || 0),

    // Card 3 — Quest Log
    commits: String(data.commits || 0),
    prs: String(data.prs || 0),
    issues: String(data.issues || 0),
    reviews: String(data.reviews || 0),
    longest: String(data.longest_streak || 0),
    current: String(data.current_streak || 0),

    // Card 5 — Footer
    quote_1_text:
      overrides.quote_1_text ||
      "Code is like humor. When you have to explain it, its bad.",
    quote_2_text:
      overrides.quote_2_text || "Simplicity is prerequisite for reliability.",
    quote_3_text:
      overrides.quote_3_text || "Make it work, make it right, make it fast.",
  };

  // Card 4 — Languages
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
        map[`lang_${n}_pct`] = lang.pct.toFixed(1);
        map[`lang_${n}_color`] = lang.color;
        map[`lang_${n}_dashoffset`] = String(
          440 - Math.round((lang.pct / 100) * 440),
        );
      }
    });
  }

  // Card 5 — Hearts
  for (let h = 1; h <= 3; h++) {
    map[`heart_${h}_fill`] = overrides[`heart_${h}_fill`] || "#1a1a2e";
    map[`heart_${h}_animation`] = overrides[`heart_${h}_animation`] || "";
  }

  return map;
}

function renderCard(cardId, data, overrides = {}) {
  const template = templates[String(cardId)];
  if (!template) {
    throw new Error(`Template for Card ID ${cardId} not found.`);
  }

  const tokenMap = buildTokenMap(data, overrides);
  let renderedSvg = template;

  for (const [key, value] of Object.entries(tokenMap)) {
    renderedSvg = renderedSvg.replaceAll(`{{${key}}}`, value);
  }

  // Card 1 Avatar: Since we download locally on the frontend,
  // the API will render a default visual placeholder rect.
  if (String(cardId) === "1") {
    const avatarRegex =
      /\{\{avatar_x="([^"]+)"_y="([^"]+)"_width="([^"]+)"_height="([^"]+)"\}\}/;
    const match = renderedSvg.match(avatarRegex);
    if (match) {
      const [fullToken, x, y, width, height] = match;
      renderedSvg = renderedSvg.replace(
        fullToken,
        `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#1a1a2e" rx="3"/>`,
      );
    }
  }

  return renderedSvg;
}

module.exports = {
  renderCard,
  reloadTemplates: loadTemplates,
};

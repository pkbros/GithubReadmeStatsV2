const fs = require("fs");
const path = require("path");

// Templates in-memory cache
const templates = {};
const templatesDir = path.join(__dirname, "../templates");

// Helper to load templates into memory
function loadTemplates() {
  try {
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
    console.log("SVG templates loaded successfully.");
  } catch (error) {
    console.error("Error loading SVG templates:", error.message);
  }
}

// Load them immediately on start
loadTemplates();

/**
 * Builds the full mapping of token names to display values
 */
function buildTokenMap(data) {
  const map = {
    // Card 2 — Stats
    repos: String(data.repos),
    stars: String(data.stars),
    forks: String(data.forks),
    followers: String(data.followers),
    following: String(data.following),

    // Card 3 — Quest Log
    commits: String(data.commits),
    prs: String(data.prs),
    issues: String(data.issues),
    reviews: String(data.reviews),
    longest: String(data.longest_streak),
    current: String(data.current_streak),
  };

  // Card 4 — Tech Stack (Languages, up to 5)
  // We initialize all 5 slots to defaults in case a user has fewer than 5 languages.
  for (let i = 1; i <= 5; i++) {
    map[`lang_${i}_name`] = "—";
    map[`lang_${i}_pct`] = "0.0";
    map[`lang_${i}_color`] = "#1a1a2e"; // Invisible color matching bar background
    map[`lang_${i}_dashoffset`] = "440"; // 440 means 0% progress bar length
  }

  // Populate actual language values
  if (data.languages && Array.isArray(data.languages)) {
    data.languages.forEach((lang, index) => {
      const n = index + 1;
      if (n <= 5) {
        map[`lang_${n}_name`] = lang.name;
        map[`lang_${n}_pct`] = lang.pct.toFixed(1);
        map[`lang_${n}_color`] = lang.color;
        // SVG math: progress length of 440 means 100%. Dashoffset of 440 - length.
        const barWidth = Math.round((lang.pct / 100) * 440);
        map[`lang_${n}_dashoffset`] = String(440 - barWidth);
      }
    });
  }

  return map;
}

/**
 * Renders a card by taking a cardId, finding the template, and replacing tokens
 */
function renderCard(cardId, data) {
  const template = templates[String(cardId)];
  if (!template) {
    throw new Error(`Template for Card ID ${cardId} not found.`);
  }

  const tokenMap = buildTokenMap(data);
  let renderedSvg = template;

  // Replace all {{token}} occurrences
  for (const [key, value] of Object.entries(tokenMap)) {
    renderedSvg = renderedSvg.replaceAll(`{{${key}}}`, value);
  }

  return renderedSvg;
}

module.exports = {
  renderCard,
  reloadTemplates: loadTemplates, // In case we want to reload them dynamically later
};

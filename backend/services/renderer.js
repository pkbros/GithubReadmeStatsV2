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

/**
 * Escapes a value so it can be safely injected as SVG/XML text or attribute
 * content. Without this, user-controlled values containing &, <, >, " or '
 * (e.g. a GitHub bio of "AI & Systems") produce invalid XML and the card
 * fails to render. Raw SVG tokens such as animations are intentionally NOT
 * passed through this helper.
 */
function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Returns an override when the query parameter is present (even if it is an
 * empty string) and the fallback otherwise. This lets a user intentionally
 * clear a field instead of silently getting the default back.
 */
function pick(overrides, key, fallback) {
  return overrides[key] !== undefined ? overrides[key] : fallback;
}

// Defaults used when no animation is supplied via query params. Heart 2 keeps
// its historical blink so existing embeds render exactly as before.
const HEART_ANIMATION_DEFAULTS = {
  1: "",
  2: '<animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>',
  3: "",
};

// `heart_*_animation` values are injected as raw SVG, so only the animations the
// editor actually offers are accepted. Anything else is dropped instead of
// allowing arbitrary markup (e.g. <script>) from a query parameter.
const ALLOWED_HEART_ANIMATIONS = new Set(
  [
    "",
    "<animateTransform attributeName='transform' type='scale' values='1;1.08;1' dur='1.2s' repeatCount='indefinite'/>",
    "<animate attributeName='opacity' values='1;0;1' dur='1s' repeatCount='indefinite'/>",
    "<animate attributeName='opacity' values='1;0.3;1' dur='2s' repeatCount='indefinite'/>",
    ...Object.values(HEART_ANIMATION_DEFAULTS),
  ].map(canonicalizeAnimation),
);

function canonicalizeAnimation(value) {
  return String(value ?? "")
    .trim()
    .replace(/"/g, "'")
    .replace(/\s+/g, " ")
    .replace(/\s*\/>$/, "/>");
}

function sanitizeHeartAnimation(value, fallback = "") {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (ALLOWED_HEART_ANIMATIONS.has(canonicalizeAnimation(raw))) return raw;
  // Unknown/unsafe value: fall back to the default animation for this heart.
  const safeFallback = String(fallback ?? "").trim();
  return ALLOWED_HEART_ANIMATIONS.has(canonicalizeAnimation(safeFallback))
    ? safeFallback
    : "";
}

function buildTokenMap(data, overrides = {}) {
  const esc = escapeXml;
  const map = {
    // Card 1 — Identity
    name: esc(pick(overrides, "name", data.name || data.username || "")),
    username: esc(data.username || ""),
    bio: esc(pick(overrides, "bio", data.bio || "")),
    field_1: esc(pick(overrides, "field_1", "EMAIL")),
    value_1: esc(pick(overrides, "value_1", "")),
    field_2: esc(pick(overrides, "field_2", "LINKEDIN")),
    value_2: esc(pick(overrides, "value_2", "")),
    field_3: esc(pick(overrides, "field_3", "STATUS")),
    value_3: esc(pick(overrides, "value_3", "")),

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
    quote_1_text: esc(
      pick(
        overrides,
        "quote_1_text",
        "Code is like humor. When you have to explain it, its bad.",
      ),
    ),
    quote_2_text: esc(
      pick(
        overrides,
        "quote_2_text",
        "Simplicity is prerequisite for reliability.",
      ),
    ),
    quote_3_text: esc(
      pick(
        overrides,
        "quote_3_text",
        "Make it work, make it right, make it fast.",
      ),
    ),
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
        map[`lang_${n}_name`] = esc(lang.name);
        map[`lang_${n}_pct`] = lang.pct.toFixed(1);
        map[`lang_${n}_color`] = esc(lang.color);
        map[`lang_${n}_dashoffset`] = String(
          440 - Math.round((lang.pct / 100) * 440),
        );
      }
    });
  }

  // Card 5 — Hearts
  // `heart_*_animation` is intentionally left unescaped: it carries raw SVG
  // markup (e.g. <animate />) supplied by the template metadata, not text.
  for (let h = 1; h <= 3; h++) {
    map[`heart_${h}_fill`] = esc(overrides[`heart_${h}_fill`] || "#1a1a2e");
    map[`heart_${h}_animation`] = sanitizeHeartAnimation(
      pick(overrides, `heart_${h}_animation`, HEART_ANIMATION_DEFAULTS[h]),
      HEART_ANIMATION_DEFAULTS[h],
    );
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
    // Use a function replacement so `$&`, `$'`, `$$` etc. inside user text are
    // inserted literally instead of being interpreted as replacement patterns.
    renderedSvg = renderedSvg.replaceAll(`{{${key}}}`, () => value);
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
  buildTokenMap,
  escapeXml,
  reloadTemplates: loadTemplates,
};

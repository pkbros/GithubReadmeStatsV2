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
 * Escapes a value for safe inclusion in SVG/XML, in both text content and
 * quoted attribute positions. Done in a single pass over a character class so
 * that "&" cannot be double-escaped by a later replacement.
 */
function escapeXml(value) {
  return String(value ?? "").replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
}

/**
 * Server-side allowlist of heart animations. Callers send a key (e.g. "pulse")
 * and the server resolves it to markup — arbitrary SVG is never accepted from
 * user input. These are the only values ever substituted into the template
 * unescaped, and they are defined here rather than derived from a request.
 */
const HEART_ANIMATIONS = {
  none: "",
  pulse:
    "<animateTransform attributeName='transform' type='scale' values='1;1.08;1' dur='1.2s' repeatCount='indefinite'/>",
  blink:
    "<animate attributeName='opacity' values='1;0;1' dur='1s' repeatCount='indefinite'/>",
  fade: "<animate attributeName='opacity' values='1;0.3;1' dur='2s' repeatCount='indefinite'/>",
};

/**
 * Transitional mapping so clients still sending the previous raw-markup values
 * keep working during rollout. Only these exact, known-good strings are
 * recognised; anything else falls back to "none". Safe to delete once the
 * deployed frontend sends keys.
 */
const LEGACY_ANIMATION_MARKUP = new Map([
  [HEART_ANIMATIONS.pulse, "pulse"],
  [HEART_ANIMATIONS.blink, "blink"],
  [HEART_ANIMATIONS.fade, "fade"],
]);

/** Resolves a user-supplied animation value to allowlisted markup. */
function resolveHeartAnimation(raw) {
  if (raw === undefined || raw === null || raw === "") return HEART_ANIMATIONS.none;
  const value = String(raw);
  const key = HEART_ANIMATIONS[value.toLowerCase()] !== undefined
    ? value.toLowerCase()
    : LEGACY_ANIMATION_MARKUP.get(value);
  return key ? HEART_ANIMATIONS[key] : HEART_ANIMATIONS.none;
}

/** Hex colours only (#RGB, #RRGGBB, #RRGGBBAA); anything else uses the default. */
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

function resolveColor(raw, fallback) {
  return typeof raw === "string" && HEX_COLOR_RE.test(raw) ? raw : fallback;
}

function buildTokenMap(data, overrides = {}) {
  const map = {
    // Card 1 — Identity
    // Every value here is escaped: query overrides are attacker-controlled, and
    // so are the GitHub-sourced fields (a user controls their own name/bio).
    name: escapeXml(overrides.name || data.name || data.username || ""),
    username: escapeXml(data.username || ""),
    bio: escapeXml(overrides.bio || data.bio || ""),
    field_1: escapeXml(overrides.field_1 || "EMAIL"),
    value_1: escapeXml(overrides.value_1 || ""),
    field_2: escapeXml(overrides.field_2 || "LINKEDIN"),
    value_2: escapeXml(overrides.value_2 || ""),
    field_3: escapeXml(overrides.field_3 || "STATUS"),
    value_3: escapeXml(overrides.value_3 || ""),

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
    quote_1_text: escapeXml(
      overrides.quote_1_text ||
        "Code is like humor. When you have to explain it, its bad.",
    ),
    quote_2_text: escapeXml(
      overrides.quote_2_text || "Simplicity is prerequisite for reliability.",
    ),
    quote_3_text: escapeXml(
      overrides.quote_3_text || "Make it work, make it right, make it fast.",
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
        map[`lang_${n}_name`] = escapeXml(lang.name);
        map[`lang_${n}_pct`] = Number(lang.pct || 0).toFixed(1);
        map[`lang_${n}_color`] = resolveColor(lang.color, "#1a1a2e");
        map[`lang_${n}_dashoffset`] = String(
          440 - Math.round((lang.pct / 100) * 440),
        );
      }
    });
  }

  // Card 5 — Hearts
  // Fills are validated as hex colours; animations are resolved from a
  // server-side allowlist. Neither accepts arbitrary markup from the caller.
  for (let h = 1; h <= 3; h++) {
    map[`heart_${h}_fill`] = resolveColor(
      overrides[`heart_${h}_fill`],
      "#1a1a2e",
    );
    map[`heart_${h}_animation`] = resolveHeartAnimation(
      overrides[`heart_${h}_animation`],
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

  // Single pass: substituted content is never re-scanned, so a value cannot
  // introduce a "{{token}}" that a later iteration would then expand. Unknown
  // tokens are left intact (the Card 1 avatar token is handled below).
  let renderedSvg = template.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(tokenMap, key)
      ? tokenMap[key]
      : match,
  );

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

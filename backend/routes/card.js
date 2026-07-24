const express = require("express");
const router = express.Router();
const { fetchGithubStats } = require("../services/github");
const { renderCard } = require("../services/renderer");
const {
  getCachedStats,
  getStaleCachedStats,
  setCachedStats,
} = require("../services/cache");

// GitHub usernames are alphanumeric plus hyphen, 1–39 characters.
const USERNAME_RE = /^[a-zA-Z0-9-]{1,39}$/;

/** Escapes a value for safe inclusion in the inline SVG helpers below. */
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
 * Applies the response headers every card shares. The CSP is a backstop: even
 * if a value were ever emitted unescaped, nothing may execute or load when the
 * SVG is opened directly as a document.
 */
function setCardHeaders(res, cacheControl) {
  res.setHeader("Content-Type", "image/svg+xml");
  // default-src 'none' per the agreed plan. style-src 'unsafe-inline' is
  // required because all five templates carry an inline <style> block for
  // fonts/classes; without it every card loses its styling. The templates
  // reference no external resources, so nothing else needs relaxing.
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; style-src 'unsafe-inline'",
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (cacheControl) res.setHeader("Cache-Control", cacheControl);
}

// Helper to generate a neon-themed error SVG
function renderErrorSvg(message) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 190" width="760" height="190">
        <style>
          .txt { font-family: ui-monospace, 'SFMono-Regular', Consolas, monospace; }
        </style>
        <rect x="1" y="1" width="758" height="188" rx="6" fill="#0a0a0f" stroke="#ff2d55" stroke-width="1.5"/>
        <text x="50%" y="45%" class="txt" dominant-baseline="middle" text-anchor="middle" fill="#ff2d55" font-size="16" font-weight="bold">CARD RENDER ERROR</text>
        <text x="50%" y="65%" class="txt" dominant-baseline="middle" text-anchor="middle" fill="#e0e0e0" font-size="12">${escapeXml(String(message).toUpperCase())}</text>
      </svg>`;
}

// Helper to generate a neon-themed rate limit fallback SVG
function renderRateLimitSvg(username) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 190" width="760" height="190">
        <style>
          .txt { font-family: ui-monospace, 'SFMono-Regular', Consolas, monospace; }
        </style>
        <rect x="1" y="1" width="758" height="188" rx="8" fill="#0a0a0f" stroke="#ff9500" stroke-width="1.5"/>
        <text x="50%" y="36%" class="txt" dominant-baseline="middle" text-anchor="middle" fill="#ff9500" font-size="15" font-weight="bold">⏳ GITHUB API RATE LIMIT COOLING DOWN</text>
        <text x="50%" y="56%" class="txt" dominant-baseline="middle" text-anchor="middle" fill="#e0e0e0" font-size="12">Live stats for @${escapeXml(username)} are temporarily paused</text>
        <text x="50%" y="74%" class="txt" dominant-baseline="middle" text-anchor="middle" fill="#777777" font-size="10">GitHub API quota exceeded. Card will auto-update shortly.</text>
      </svg>`;
}

// Helper to generate a neon-themed network timeout fallback SVG
function renderNetworkTimeoutSvg(username) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 190" width="760" height="190">
        <style>
          .txt { font-family: ui-monospace, 'SFMono-Regular', Consolas, monospace; }
        </style>
        <rect x="1" y="1" width="758" height="188" rx="8" fill="#0a0a0f" stroke="#00f0ff" stroke-width="1.5"/>
        <text x="50%" y="36%" class="txt" dominant-baseline="middle" text-anchor="middle" fill="#00f0ff" font-size="15" font-weight="bold">⚡ GITHUB CONNECTION TIMEOUT</text>
        <text x="50%" y="56%" class="txt" dominant-baseline="middle" text-anchor="middle" fill="#e0e0e0" font-size="12">Unable to reach GitHub servers for @${escapeXml(username)}</text>
        <text x="50%" y="74%" class="txt" dominant-baseline="middle" text-anchor="middle" fill="#777777" font-size="10">Retrying connection in background. Please refresh in a moment.</text>
      </svg>`;
}

// GET /api/card/:cardId
router.get("/:cardId", async (req, res) => {
  const { cardId } = req.params;
  const { username } = req.query;

  // Validate cardId
  if (!["1", "2", "3", "4", "5"].includes(cardId)) {
    setCardHeaders(res);
    return res.send(renderErrorSvg("Invalid Card ID. Use 1 to 5."));
  }

  // Validate username
  if (!username) {
    setCardHeaders(res);
    return res.send(renderErrorSvg("Username query parameter is required."));
  }

  // Reject anything that cannot be a GitHub username before it reaches the
  // cache, the GitHub API, or any SVG. Closes the fallback-SVG paths below and
  // avoids pointless upstream calls for junk input.
  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    setCardHeaders(res);
    return res.send(renderErrorSvg("Invalid username format."));
  }

  try {
    // 1. Try to read from Supabase cache
    let statsData = await getCachedStats(username);

    // 2. If cache miss, fetch live from GitHub and cache the result
    if (!statsData) {
      console.log(`Cache MISS for user: ${username}. Fetching live...`);
      statsData = await fetchGithubStats(username);
      await setCachedStats(username, statsData);
    }
    // Parse all extra query parameters as overrides
    const { username: _, ...overrides } = req.query;

    // Render SVG
    const svg = renderCard(cardId, statsData, overrides);

    // 4. Send response with headers
    setCardHeaders(res, "public, max-age=7200, stale-while-revalidate=3600");
    res.send(svg);
  } catch (error) {
    console.error(`Error generating card ${cardId}:`, error.message);
    setCardHeaders(res);

    if (error.isRateLimit || error.isNetworkTimeout) {
      // 1. Try to serve last cached data from DB even if TTL has passed
      try {
        const staleStats = await getStaleCachedStats(username);
        if (staleStats) {
          console.log(`Serving STALE cache for user: ${username} during API error/rate-limit`);
          const { username: _, ...overrides } = req.query;
          const svg = renderCard(cardId, staleStats, overrides);
          setCardHeaders(res, "public, max-age=300");
          return res.send(svg);
        }
      } catch (staleErr) {
        console.error("Failed to retrieve stale cache fallback:", staleErr.message);
      }

      // 2. If user is NOT in DB already, return Rate Limit or Connection Timeout SVG
      if (error.isRateLimit) {
        setCardHeaders(res, "public, max-age=300");
        return res.send(renderRateLimitSvg(username));
      }

      if (error.isNetworkTimeout) {
        setCardHeaders(res, "public, max-age=60");
        return res.send(renderNetworkTimeoutSvg(username));
      }
    }

    res.send(renderErrorSvg(error.message || "Failed to generate card"));
  }
});

module.exports = router;

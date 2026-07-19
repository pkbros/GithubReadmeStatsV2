const express = require("express");
const router = express.Router();
const { fetchGithubStats } = require("../services/github");
const { renderCard } = require("../services/renderer");
const { getCachedStats, setCachedStats } = require("../services/cache");

// Helper to generate a neon-themed error SVG
function renderErrorSvg(message) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 190" width="760" height="190">
        <style>
          .txt { font-family: ui-monospace, 'SFMono-Regular', Consolas, monospace; }
        </style>
        <rect x="1" y="1" width="758" height="188" rx="6" fill="#0a0a0f" stroke="#ff2d55" stroke-width="1.5"/>
        <text x="50%" y="45%" class="txt" dominant-baseline="middle" text-anchor="middle" fill="#ff2d55" font-size="16" font-weight="bold">CARD RENDER ERROR</text>
        <text x="50%" y="65%" class="txt" dominant-baseline="middle" text-anchor="middle" fill="#e0e0e0" font-size="12">${message.toUpperCase()}</text>
      </svg>`;
}

// GET /api/card/:cardId
router.get("/:cardId", async (req, res) => {
  const { cardId } = req.params;
  const { username } = req.query;

  // Validate cardId
  if (!["2", "3", "4"].includes(cardId)) {
    res.setHeader("Content-Type", "image/svg+xml");
    return res.send(
      renderErrorSvg(`Invalid Card ID: ${cardId}. Use 2, 3, or 4.`),
    );
  }

  // Validate username
  if (!username) {
    res.setHeader("Content-Type", "image/svg+xml");
    return res.send(renderErrorSvg("Username query parameter is required."));
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

    // 3. Render SVG
    const svg = renderCard(cardId, statsData);

    // 4. Send response with headers
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader(
      "Cache-Control",
      "public, max-age=7200, stale-while-revalidate=3600",
    );
    res.send(svg);
  } catch (error) {
    console.error(`Error generating card ${cardId}:`, error.message);
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(renderErrorSvg(error.message || "Failed to generate card"));
  }
});

module.exports = router;

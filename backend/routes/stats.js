const express = require("express");
const router = express.Router();
const { fetchGithubStats } = require("../services/github");
const { getCachedStats, setCachedStats } = require("../services/cache");

// GET /api/stats/:username
router.get("/:username", async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
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

    res.json(statsData);
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch GitHub stats" });
  }
});

module.exports = router;

const { createClient } = require("@supabase/supabase-js");

// Initialize the Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn("Supabase credentials missing. Caching will be disabled.");
}

const CACHE_TTL_HOURS = parseInt(process.env.CACHE_TTL_HOURS || "6", 10);

/**
 * Gets cached stats for a username if it exists and is fresh.
 * Returns null if cache miss, expired, or on database error.
 */
async function getCachedStats(username) {
  if (!supabase) return null;

  const normalizedUsername = username.toLowerCase();

  try {
    // We race the database query against a 2-second timeout to handle Supabase sleep/cold start gracefully
    const dbQuery = supabase
      .from("github_cache")
      .select("data, fetched_at")
      .eq("username", normalizedUsername)
      .single();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database query timed out")), 2000),
    );

    const { data, error } = await Promise.race([dbQuery, timeoutPromise]);

    if (error) {
      // Row not found (cache miss) is not a critical error, just return null
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Supabase fetch error:", error.message);
      return null;
    }

    if (data && data.fetched_at) {
      const fetchedAt = new Date(data.fetched_at);
      const now = new Date();
      const ageInHours = (now - fetchedAt) / (1000 * 60 * 60);

      if (ageInHours < CACHE_TTL_HOURS) {
        console.log(
          `Cache HIT for user: ${normalizedUsername} (Age: ${ageInHours.toFixed(2)}h)`,
        );
        return data.data; // Return the cached JSON stats
      }

      console.log(
        `Cache EXPIRED for user: ${normalizedUsername} (Age: ${ageInHours.toFixed(2)}h)`,
      );
    }

    return null;
  } catch (error) {
    console.error(
      `Supabase cache read failed for ${normalizedUsername}:`,
      error.message,
    );
    return null; // Fallback to live fetch
  }
}

/**
 * Upserts the computed stats data into the Supabase cache.
 */
async function setCachedStats(username, data) {
  if (!supabase) return;

  const normalizedUsername = username.toLowerCase();

  try {
    const { error } = await supabase.from("github_cache").upsert({
      username: normalizedUsername,
      data: data,
      fetched_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Supabase write error:", error.message);
    } else {
      console.log(`Cache updated for user: ${normalizedUsername}`);
    }
  } catch (error) {
    console.error(
      `Supabase cache write failed for ${normalizedUsername}:`,
      error.message,
    );
  }
}

/**
 * Gets cached stats for a username regardless of TTL expiration (stale fallback for rate limits).
 */
async function getStaleCachedStats(username) {
  if (!supabase) return null;

  const normalizedUsername = username.toLowerCase();

  try {
    const dbQuery = supabase
      .from("github_cache")
      .select("data")
      .eq("username", normalizedUsername)
      .single();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database query timed out")), 2000),
    );

    const { data, error } = await Promise.race([dbQuery, timeoutPromise]);

    if (error || !data) {
      return null;
    }

    console.log(`Serving STALE cache fallback for user: ${normalizedUsername}`);
    return data.data;
  } catch (error) {
    console.error(`Stale cache fallback lookup failed for ${normalizedUsername}:`, error.message);
    return null;
  }
}

module.exports = {
  getCachedStats,
  getStaleCachedStats,
  setCachedStats,
};

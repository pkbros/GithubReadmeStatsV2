const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "github_readme_stats";
const COLLECTION_NAME = "github_cache";
const CACHE_TTL_HOURS = parseInt(process.env.CACHE_TTL_HOURS || "6", 10);
const QUERY_TIMEOUT_MS = 2000;

let client = null;
let clientPromise = null;
let collection = null;

if (!MONGODB_URI) {
  console.warn("MONGODB_URI is missing. Caching will be disabled.");
}

function normalizeUsername(username) {
  return String(username ?? "").toLowerCase();
}

/**
 * Lazily connects to MongoDB and returns the cache collection.
 * The client is created once per process and reused across requests.
 */
async function getCollection() {
  if (!MONGODB_URI) return null;
  if (collection) return collection;
  if (clientPromise) return clientPromise;

  client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: QUERY_TIMEOUT_MS,
    connectTimeoutMS: QUERY_TIMEOUT_MS,
    socketTimeoutMS: QUERY_TIMEOUT_MS,
    maxPoolSize: 5,
  });

  clientPromise = client
    .connect()
    .then(async (connected) => {
      const coll = connected.db(MONGODB_DB).collection(COLLECTION_NAME);
      // One cache document per username. Idempotent on every process start.
      await coll.createIndex({ username: 1 }, { unique: true });
      collection = coll;
      console.log("MongoDB cache connected.");
      return coll;
    })
    .catch(async (error) => {
      const failedClient = client;
      client = null;
      clientPromise = null;
      collection = null;
      if (failedClient) {
        try {
          await failedClient.close();
        } catch {
          // ignore close failures while handling the original error
        }
      }
      throw error;
    });

  return clientPromise;
}

/**
 * Races a promise against a timeout so a slow/unavailable database can never
 * hang a card request.
 */
function withTimeout(promise, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), QUERY_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Gets cached stats for a username if it exists and is fresh.
 * Returns null if cache miss, expired, caching is disabled, or on error.
 */
async function getCachedStats(username) {
  if (!MONGODB_URI) return null;

  const normalizedUsername = normalizeUsername(username);

  try {
    const coll = await getCollection();
    if (!coll) return null;

    const doc = await withTimeout(
      coll.findOne({ username: normalizedUsername }),
      "Database query timed out",
    );

    if (!doc || !doc.fetchedAt) return null;

    const ageInHours =
      (Date.now() - new Date(doc.fetchedAt).getTime()) / (1000 * 60 * 60);

    if (ageInHours < CACHE_TTL_HOURS) {
      console.log(
        `Cache HIT for user: ${normalizedUsername} (Age: ${ageInHours.toFixed(2)}h)`,
      );
      return doc.data;
    }

    console.log(
      `Cache EXPIRED for user: ${normalizedUsername} (Age: ${ageInHours.toFixed(2)}h)`,
    );
    return null;
  } catch (error) {
    console.error(
      `MongoDB cache read failed for ${normalizedUsername}:`,
      error.message,
    );
    return null; // Fallback to live fetch
  }
}

/**
 * Upserts the computed stats data into the MongoDB cache.
 */
async function setCachedStats(username, data) {
  if (!MONGODB_URI) return;

  const normalizedUsername = normalizeUsername(username);

  try {
    const coll = await getCollection();
    if (!coll) return;

    await withTimeout(
      coll.updateOne(
        { username: normalizedUsername },
        {
          $set: {
            username: normalizedUsername,
            data,
            fetchedAt: new Date(),
          },
        },
        { upsert: true },
      ),
      "Database write timed out",
    );

    console.log(`Cache updated for user: ${normalizedUsername}`);
  } catch (error) {
    console.error(
      `MongoDB cache write failed for ${normalizedUsername}:`,
      error.message,
    );
  }
}

/**
 * Gets cached stats for a username regardless of TTL expiration
 * (stale fallback for rate limits / network errors).
 */
async function getStaleCachedStats(username) {
  if (!MONGODB_URI) return null;

  const normalizedUsername = normalizeUsername(username);

  try {
    const coll = await getCollection();
    if (!coll) return null;

    const doc = await withTimeout(
      coll.findOne({ username: normalizedUsername }),
      "Database query timed out",
    );

    if (!doc) return null;

    console.log(`Serving STALE cache fallback for user: ${normalizedUsername}`);
    return doc.data;
  } catch (error) {
    console.error(
      `MongoDB stale cache lookup failed for ${normalizedUsername}:`,
      error.message,
    );
    return null;
  }
}

/**
 * Closes the shared client (used for graceful shutdown).
 */
async function closeCache() {
  if (client) {
    await client.close();
  }
  client = null;
  clientPromise = null;
  collection = null;
}

module.exports = {
  getCachedStats,
  getStaleCachedStats,
  setCachedStats,
  closeCache,
};

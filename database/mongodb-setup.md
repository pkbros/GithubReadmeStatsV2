# MongoDB Cache Setup

The app uses a single collection, `github_cache`. `backend/services/cache.js`
lazily connects on first use and creates the required unique index
automatically, so no manual schema step is normally needed.

## 1. Get a connection URI

- **MongoDB Atlas:** create a free cluster, add a database user, allow your
  deployment IPs, then copy the SRV connection string.
- **Local MongoDB:** `mongodb://127.0.0.1:27017`

## 2. Configure `backend/.env`

```ini
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=github_readme_stats
CACHE_TTL_HOURS=6
```

If `MONGODB_URI` is missing, caching is disabled and the API always fetches
live from GitHub (it logs a warning at startup).

## 3. Document shape

```json
{
  "username": "octocat",
  "data": { "repos": 42, "stars": 128, "languages": [] },
  "fetchedAt": "2026-11-16T00:00:00.000Z"
}
```

## 4. Index (created automatically)

```js
db.github_cache.createIndex({ username: 1 }, { unique: true });
```

## Notes

- Documents are **kept after the TTL expires** so the API can serve the last
  known snapshot when GitHub is rate-limited. Do not add a short TTL index.
- Optional manual cleanup of very old rows:
  ```js
  db.github_cache.deleteMany({
    fetchedAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
  });
  ```

# TRACKER.md — GithubReadmeStatsV2

Single source of truth for project status, decisions, and next steps. Read this first in every session.

## Current phase

**Bug hardening + MongoDB migration are committed and deployed.** Cloud Run revision `github-readmestats-00005-tnh` serves the new code with MongoDB caching, verified live (MISS → fetch → upsert → HIT). Commit `461225e` on `main` holds all changes. The frontend build was not redeployed (Firebase CLI is not installed).

## Session log

### 2026-11-16 — Bug hardening + Supabase → MongoDB migration

**Status: DONE (local verification). Deploy not performed.**

#### A. Bug fixes (verified)

1. **XML/SVG injection & special-character crash** — text tokens are now XML-escaped before injection.
   - `backend/services/renderer.js` — `escapeXml()` applied in `buildTokenMap()`.
   - `frontend/src/utils/svgRenderer.js` — `escapeXml()`; `replaceSvgTokens()` escapes all values except raw `*_animation` tokens.
   - `backend/routes/card.js` — escapes `username` / error text in rate-limit, timeout, and error SVGs.
2. **`$&` / `$'` replacement-pattern corruption** — switched to function replacements in both renderers.
3. **Stray card-5 metadata control** — removed the orphan `{ "label": "None", "value": "" }` from both template copies.
4. **Avatar clipPath missing** — added `<clipPath id="avatarClip">` to card 1 in both template copies; uploaded avatars now render.
5. **Dead `heart_2_animation` control** — replaced the hard-coded `<animate>` in card 5 with `{{heart_2_animation}}`; backend keeps the same blink as the default so live output is unchanged when no override is sent.
6. **Cleared fields were dropped** — overrides now use presence checks (`!== undefined`) so an intentionally empty field stays empty in both preview and API URL.
7. **Raw `{{tokens}}` in preview** — defaults are initialized for every card on metadata load; `buildStatsTokenMap()` always returns a complete map (zeros/`—` when stats are missing); stats fetch now checks `res.ok` and shows an error message.
8. **Duplicate `username` query params** — card route rejects non-string usernames with an error SVG instead of throwing.
9. **PR / issue labels** — query now uses `pullRequests(states: [MERGED])` and `issues(states: [CLOSED])` to match “PRs Merged” / “Issues Closed”. **This changes displayed counts** (now accurate to the labels).

#### B. MongoDB migration

- Replaced `backend/services/cache.js` (Supabase) with a MongoDB implementation using the native `mongodb` driver.
  - Collection: `github_cache`, document `{ username, data, fetchedAt }`.
  - Unique index on `username` created lazily on first connection.
  - Same exported contract: `getCachedStats`, `getStaleCachedStats`, `setCachedStats` (+ new `closeCache`).
  - Lazy single client per process; 2s query timeout so a slow DB never hangs a card.
- `backend/server.js` — graceful shutdown closes the Mongo client on SIGTERM/SIGINT.
- Removed `@supabase/supabase-js`; added `mongodb` (`^7.9.0`).
- Updated `backend/.env.example`, `README.md`, `Deployment.md`, `CONTRIBUTING.md`, `Plan.md`, `ARCHITECTURE.md`.
- `database/schema.sql` replaced by `database/mongodb-setup.md`.

#### Proof (observed output)

- Backend `npm test`: **38/38 pass** (was 12/12 at start).
- Frontend `npm run build`: **success** (1788 modules, no errors).
- Frontend renderer check: **6/6 pass**.
- Server smoke (cache disabled): health 200, error SVGs valid, templates load.
- Server smoke (unreachable Mongo URI): responds in **~2025ms**, logs the Mongo failure, falls back, does not crash.
- Mermaid checker on `ARCHITECTURE.md`: **2 passed, 0 failed**.
- **Live MongoDB round-trip (Atlas `cluster0.2601ymy.mongodb.net`, DB `github_readme_stats`)**: **PASS** — set → fresh cache hit → stale read → cleanup deleted 1 document.
- **Live local E2E** (real PAT from Cloud Run, real Atlas): **PASS** — card 2 miss 988ms → hit 54ms, escaping (`AI &amp; Systems &lt;3`), duplicate username rejected, all 5 cards render with no `{{tokens}}`, stats endpoint returns numbers, graceful shutdown.
- Heart animation values are whitelisted (Pulse/Blink/Fade only); unknown markup falls back to the default and cannot inject SVG.

#### C. Deployment (done)

- Image `asia-south1-docker.pkg.dev/my-main-project-495108/github-readme-stats/github-readmestats:mongo-20261116` built by Cloud Build (48s).
- Cloud Run `github-readmestats` revision `00005-tnh`, region `asia-south1`, 100% traffic.
- Env: `GITHUB_PAT`, `MONGODB_URI`, `MONGODB_DB`, `CACHE_TTL_HOURS` — Supabase vars removed.
- Live checks: health 200; card 2 `pkbros` **MISS 3122ms → HIT 90ms**; all 5 cards parsed as valid XML; `AI &amp; Systems &lt;3` escaping; duplicate username rejected; stats returns `repos=44`.
- Cloud Run logs: `MongoDB cache connected.` → `Cache MISS` → `Cache updated` → `Cache HIT`.
- Both service URLs verified (`71957385499.asia-south1.run.app` and `dttkjkvgua-el.a.run.app`).

#### Not deployed

- Frontend (editor fixes) — Firebase CLI is not installed; the cards themselves are backend-rendered and live.

## Decisions log (append-only)

- **2026-11-16** — Use OpenRouter free model `openrouter/baidu/ernie-5.5-flash-preview:free` for subagent/audit work while it remains free. The read-only audit surfaced 8 findings; 7 fixed, 1 deferred (100-repo cap).
- **2026-11-16** — Fix production bugs first; then migrate the cache from Supabase to MongoDB (MDB). Both done locally before any commit.
- **2026-11-16** — Do not copy existing Supabase rows; the MongoDB cache will warm cold on first request. Acceptable because cache misses simply refetch from GitHub.
- **2026-11-16** — Never ship an unverified SVG change; backend tests + frontend build + local smoke are the minimum gate.
- **2026-11-16** — Keep card 5 heart 2's blink as the backend default so existing embeds render identically after the migration.

## Known residuals / next

- [x] Add `MONGODB_URI` to `backend/.env` locally — done; live round-trip passed.
- [x] Add `MONGODB_URI` / `MONGODB_DB` to Cloud Run and remove the Supabase vars — done on revision `00005-tnh`.
- [x] **Deploy + verify a real card** — live MISS (3122ms) → HIT (90ms), Mongo logs confirmed.
- [x] **Commit all changes together** — commit `461225e`.
- [ ] Push commit `461225e` to `origin/main` (not pushed yet; deploy is live regardless).
- [ ] Redeploy the frontend (editor bug fixes) once the Firebase CLI is available.
- [x] `heart_*_animation` values are whitelisted (Pulse/Blink/Fade); unknown markup falls back to the default.
- [ ] Stars/forks/languages use only the first 100 owned repos (`repositories(first: 100)`, scoped in `Plan.md`). Paginate if accuracy for large accounts matters.
- [ ] `improvement.md` is truncated/incomplete (ends mid-code block). Not committed.

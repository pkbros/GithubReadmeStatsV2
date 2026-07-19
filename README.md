# 🌌 GitHub RPG Stats Cards (Neon Edition)

A backend-driven API platform that generates stunning, high-performance, neon-themed RPG stats cards for your GitHub profile README. Fully responsive, self-contained, and aggressively cached.

---

## 🎨 Live Preview

Here is a live demonstration of how these cards look, powered by the live Cloud Run deployment:

### 1. Stats Card (Card 2)
![Stats Card](https://github-readmestats-71957385499.asia-south1.run.app/api/card/2?username=pkbros)

### 2. Quest Log Card (Card 3)
![Quest Log Card](https://github-readmestats-71957385499.asia-south1.run.app/api/card/3?username=pkbros)

### 3. Tech Stack Card (Card 4)
![Tech Stack Card](https://github-readmestats-71957385499.asia-south1.run.app/api/card/4?username=pkbros)

---

## 🚀 Quick Start (Add to your profile)

To add these cards to your own GitHub profile README, copy and paste the Markdown below. Just replace `YOUR_GITHUB_USERNAME` with your actual username!

```markdown
<!-- GitHub RPG Stats Cards -->
<p align="center">
  <img src="https://github-readmestats-71957385499.asia-south1.run.app/api/card/2?username=YOUR_GITHUB_USERNAME" alt="Stats Card" width="760" />
  <br/>
  <img src="https://github-readmestats-71957385499.asia-south1.run.app/api/card/3?username=YOUR_GITHUB_USERNAME" alt="Quest Log Card" width="760" />
  <br/>
  <img src="https://github-readmestats-71957385499.asia-south1.run.app/api/card/4?username=YOUR_GITHUB_USERNAME" alt="Tech Stack Card" width="760" />
</p>
```

---

## 🛠️ Card Customization & API Reference

All rendering is handled on-the-fly via URL query parameters.

### Base Endpoint
`GET https://github-readmestats-71957385499.asia-south1.run.app/api/card/:cardId`

| Card ID | Card Name | Theme | Description |
|:---:|---|---|---|
| **`2`** | Stats | Neon Pink | Shows your total Repositories, Stars, Forks, Followers, and Following. |
| **`3`** | Quest Log | Neon Orange | Shows your annual Commits, PRs, Closed Issues, Code Reviews, and streaks. |
| **`4`** | Tech Stack | Neon Green | Analyzes and compiles your top 5 languages used across all repositories. |

### Parameters
*   `username` (Required): Your lowercase GitHub username. E.g., `?username=octocat`.

---

## ⚡ Tech Stack & Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       USER PROFILE README                   │
│         (Loads dynamically through GitHub Camo Proxy)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Requests SVG)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS API (Cloud Run)                  │
│                                                             │
│   1. Receives request for Card ID                           │
│   2. Checks database cache (Supabase lookup < 20ms)         │
│   3. Cache hit? Returns cached SVG                          │
│   4. Cache miss? Fetches GitHub GraphQL, updates cache,      │
│      injects stats into SVG template, and returns image     │
└──────────────────────┬──────────────────────────────┬───────┘
                       │                              │
             (Check / Write Cache)               (Fetch Stats)
                       ▼                              ▼
             ┌───────────────────┐          ┌───────────────────┐
             │   Supabase DB     │          │    GitHub API     │
             │  (4h Cache TTL)   │          │     (GraphQL)     │
             └───────────────────┘          └───────────────────┘
```

*   **Runtime:** Node.js + Express
*   **Database Caching:** Supabase (PostgreSQL) with a 4-hour expiration system.
*   **Infrastructure:** GCP Cloud Run (Serverless Docker container deployment).
*   **Data Aggregation:** GitHub GraphQL API.
*   **Styles:** Inline SVG vectors with modern neon filter effects and responsive layout dimensions.

---

## 💻 Local Development Setup

If you wish to host your own instance of this platform, follow the setup instructions below.

### 1. Prerequisites
*   Node.js (v20+ recommended)
*   GitHub Personal Access Token (PAT) with `read:user` permission.
*   Supabase database instance (free tier is fully compatible).

### 2. Installation
Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/github-readme-stats-v2.git
cd github-readme-stats-v2/backend
npm install
```

### 3. Environment Setup
Create a `.env` file in the `backend/` directory:
```env
PORT=3001
GITHUB_PAT=ghp_your_personal_access_token
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-service-role-key
CACHE_TTL_HOURS=4
```

### 4. Database Setup
Run the following DDL in your Supabase SQL editor to create the caching table:
```sql
CREATE TABLE github_cache (
  username TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 5. Start Server
```bash
# Run in development mode
npm run dev
```
Open your browser and visit: `http://localhost:3001/api/card/2?username=YOUR_USERNAME`

---

## 🔒 Security & Optimization

*   **Auto-Fallback:** The caching layer uses a 2-second timeout. If Supabase is sleeping or undergoing a cold start, the backend automatically bypasses the cache and fetches live from GitHub to ensure no broken images on profile pages.
*   **GitHub Camo Friendly:** Every image response includes headers `Cache-Control: public, max-age=7200, stale-while-revalidate=3600` causing GitHub's CDN to proxy and serve the cards globally without burdening our API server.

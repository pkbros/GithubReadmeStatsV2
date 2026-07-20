# 🌌 GitHub Neon Stats Cards

A backend-driven API platform that generates stunning, high-performance, neon-themed stats cards for your GitHub profile README. Fully responsive, self-contained, and aggressively cached.

👉 **Customize yours live on the Dashboard:** [https://github-readme-stats-v2.web.app](https://github-readme-stats-v2.web.app)

---

## 📌 Project Summary

*   **Real-time GitHub Data Aggregation:** Fetches comprehensive user statistics (repositories, stars, forks, followers, commits, PRs, issues, code reviews, streaks, and top 5 languages) via GitHub GraphQL API.
*   **Dynamic Vector (SVG) Engine:** Serves clean, standalone SVG vector graphics styled with neon glow filters, marquee animations, and sleek dark modes.
*   **Smart Database Caching:** Features a 4-hour TTL caching system using Supabase PostgreSQL to protect against GitHub API rate limits.
*   **Fail-safe Architecture:** Incorporates a 2-second database query timeout fallback—if the database experiences a cold start or network delay, the API gracefully falls back to fetching live data from GitHub without breaking user images.
*   **Production-Ready & CDN Optimized:** Deployed on GCP Cloud Run with Docker, featuring `Cache-Control` headers tailored for GitHub's Camo image proxy.

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
<!-- GitHub Neon Stats Cards -->
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
| **`1`** | Identity | Neon Cyan | Shows name, username, bio, custom avatar, and 3 customizable info rows (static host). |
| **`2`** | Stats | Neon Pink | Shows your total Repositories, Stars, Forks, Followers, and Following (dynamic API). |
| **`3`** | Quest Log | Neon Orange | Shows your annual Commits, PRs, Closed Issues, Code Reviews, and streaks (dynamic API). |
| **`4`** | Tech Stack | Neon Green | Analyzes and compiles your top 5 languages used across all repositories (dynamic API). |
| **`5`** | Footer | Neon Red | Terminal typewriter quote cycle with custom heart fill and animation controls (dynamic API). |

### Parameters (Cards 2-5)
*   `username` (Required): Your lowercase GitHub username. E.g., `?username=octocat`.
*   *Card 5 overrides:* `heart_1_fill`, `heart_1_animation`, `quote_1_text`, etc.

---

## 🗺️ Project Roadmap & Status

- [x] **Phase 1 — Backend Core Engine:** Express server, GraphQL stats fetcher, streak calculation, and SVG string replacement.
- [x] **Phase 2 — Supabase Caching Layer:** Postgres cache integration with 4-hour TTL and 2-second connection timeout fallback.
- [x] **Phase 3 — Containerization & GCP Deployment:** Dockerized backend deployed on Google Cloud Run with Artifact Registry.
- [x] **Phase 4 — Frontend Live Customizer:** React + Vite + Tailwind CSS + DaisyUI 5 dashboard deployed on Firebase Hosting.
- [x] **Phase 5 — Static Card Downloading:** Direct browser downloading for high-asset SVG cards (Card 1) to circumvent URL length limits.

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
*   **Frontend SPA:** React 19 + Vite 8 + Tailwind CSS 4 + DaisyUI 5
*   **Database Caching:** Supabase (PostgreSQL) with a 4-hour expiration system.
*   **Infrastructure:** GCP Cloud Run (Serverless Docker container) & Firebase Hosting (SPA frontend static host).
*   **Data Aggregation:** GitHub GraphQL API.

---

## 🤝 Contribution Guidelines

We welcome community contributions to help improve this project! Please follow these guidelines:

### 💡 Meaningful Contributions Only
*   Only **well-tested, meaningful contributions** will be reviewed and accepted. This includes bug fixes, documentation improvements, performance optimizations, and well-designed new card templates.
*   **No Automated / Agentic / AI Spam PRs:** Pull Requests created automatically by AI bots, unverified LLM scripts, or low-quality automated generators without human review and testing **will be rejected immediately**.

---

## 💻 Local Development Setup

If you wish to host your own instance of this platform, follow the setup instructions below.

### 1. Prerequisites
*   Node.js (v24+ recommended)
*   GitHub Personal Access Token (PAT) with `read:user` permission.
*   Supabase database instance (free tier is fully compatible).
*   Firebase CLI (optional for frontend hosting).

### 2. Backend Local Setup
```bash
# Clone the repository
git clone https://github.com/pkbros/GithubReadmeStatsV2.git
cd GithubReadmeStatsV2/backend

# Install dependencies
npm install

# Create D:\projects\GithubReadmeStatsV2\backend\.env file:
# PORT=3001
# GITHUB_PAT=ghp_your_personal_access_token
# SUPABASE_URL=https://your-project-id.supabase.co
# SUPABASE_KEY=your-supabase-service-role-key
# CACHE_TTL_HOURS=4

# Run in development mode
npm run dev
```

### 3. Frontend Local Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Run Vite dev server
npm run dev
```
Open your browser to `http://localhost:5173`.

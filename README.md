# GitHub Neon Stats Cards

A backend API and React dashboard for generating neon-themed GitHub profile stats cards. Cards are rendered directly as SVG vector images and cached using Supabase to stay within GitHub API rate limits.

Customize and preview your cards live on the dashboard: [https://github-readme-stats-v2.web.app](https://github-readme-stats-v2.web.app)

---

## Available Cards

| Card ID | Name | Type | Description |
|:---:|---|---|---|
| **1** | Identity | Static / Exportable | Profile card with bio, custom avatar upload, and customizable info rows. |
| **2** | Stats | Dynamic API | Displays total Repositories, Stars, Forks, Followers, and Following. |
| **3** | Quest Log | Dynamic API | Displays Commits, PRs, Closed Issues, Code Reviews, and Streaks. |
| **4** | Tech Stack | Dynamic API | Displays top 5 languages used across public repositories. |
| **5** | Footer | Dynamic API | Typewriter quote bar with customizable animated hearts. |

---

## Quick Start (Profile Embedding)

Add dynamic cards directly to your GitHub profile `README.md` by pasting the HTML or Markdown snippets below. Replace `YOUR_GITHUB_USERNAME` with your GitHub username:

### Markdown
```markdown
<p align="center">
  <img src="https://github-readmestats-71957385499.asia-south1.run.app/api/card/2?username=YOUR_GITHUB_USERNAME" alt="Stats Card" width="760" />
  <br/>
  <img src="https://github-readmestats-71957385499.asia-south1.run.app/api/card/3?username=YOUR_GITHUB_USERNAME" alt="Quest Log Card" width="760" />
  <br/>
  <img src="https://github-readmestats-71957385499.asia-south1.run.app/api/card/4?username=YOUR_GITHUB_USERNAME" alt="Tech Stack Card" width="760" />
</p>
```

### HTML
```html
<img src="https://github-readmestats-71957385499.asia-south1.run.app/api/card/2?username=YOUR_GITHUB_USERNAME" alt="Stats Card" width="760" />
```

---

## How It Works

1. **Request**: GitHub's image proxy (Camo) or a browser requests `/api/card/:cardId?username=yourname`.
2. **Cache Check**: The backend checks Supabase PostgreSQL for cached stats (4-hour default TTL).
3. **API Fetch**: On a cache miss, stats are fetched from GitHub's GraphQL API, stored in Supabase, and rendered into SVG card templates.
4. **Rate Limit Fallback**: If GitHub's API rate limit is reached, the backend serves the last cached snapshot from the database (or a cooldown SVG card for new users).

---

## Tech Stack

- **Backend**: Node.js, Express, Axios, Supabase (PostgreSQL)
- **Frontend**: React 19, Vite, Tailwind CSS 4, DaisyUI 5, Lucide Icons
- **Deployment**: GCP Cloud Run (Backend API), Firebase Hosting (Frontend SPA)

---

## Local Development Setup

### Prerequisites
- Node.js (v18+)
- GitHub Personal Access Token (PAT) with `read:user` permissions
- Supabase Project (URL and Service Role Key)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Configure your environment variables in `backend/.env`:
```ini
PORT=3001
GITHUB_PAT=your_github_personal_access_token
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
CACHE_TTL_HOURS=4
```

Start the backend development server:
```bash
npm run dev
```
The server will run on `http://localhost:3001`.

### 2. Frontend Setup

```bash
cd ../frontend
npm install
cp .env.example .env
```

Configure your environment variables in `frontend/.env`:
```ini
VITE_API_URL=http://localhost:3001
```

Start the Vite development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser to view the Live Customizer Dashboard.

---

## Contributing

We welcome community contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming rules, PR title formats, and submission guidelines.

## License

This project is licensed under the [MIT License](LICENSE).

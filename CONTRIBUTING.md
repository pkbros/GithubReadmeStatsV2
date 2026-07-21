# Contributing to GitHub Neon Stats Cards 🌌

Thank you for your interest in contributing to **GitHub Neon Stats Cards**! We welcome community contributions to help improve and expand this project.

Please review the following guidelines before submitting a pull request (PR).

---

## 💻 Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/pkbros/GithubReadmeStatsV2.git
cd GithubReadmeStatsV2
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your variables in .env (e.g. GITHUB_PAT, SUPABASE details)
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

---

## 🌿 Branch Naming

Please name your branches according to the type of contribution:

- `feat/feature-name`
- `fix/bug-name`
- `docs/topic-name`

---

## 🏷️ PR Title Format

All PR titles should follow this format:

```text
[ELUSoC'26] brief description
```

*Example:* `[ELUSoC'26] add CONTRIBUTING.md guidelines`

---

## ✅ Accepted Contributions

We welcome the following types of contributions:

- **Bug fixes** with reproduction steps
- **New card templates** (SVG-based)
- **Performance improvements**
- **Documentation improvements**
- **Frontend UI improvements**

---

## 🚫 NOT Accepted

The following will be rejected immediately:

- **AI-generated spam PRs**
- **Low quality automated contributions**
- **PRs without testing**

---

## 📋 PR Checklist

Before submitting your pull request, ensure you have:

- [ ] Tested locally
- [ ] Verified `npm run dev` works without errors
- [ ] Ensured no `.env` files are committed
- [ ] Provided a clear description of changes

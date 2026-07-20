-- Supabase / PostgreSQL Cache Table Setup
-- Run this DDL query in your database SQL Editor to set up the caching table.

CREATE TABLE IF NOT EXISTS github_cache (
  username TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for optimized username searching
CREATE INDEX IF NOT EXISTS idx_github_cache_username ON github_cache(username);

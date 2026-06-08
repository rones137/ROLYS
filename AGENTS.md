# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Anime Runch is a single-process Vite + React SPA (no Docker, no monorepo). Standard setup is documented in `README.md`: `npm install` then `npm run dev`.

### Services

| Service | Port | Notes |
|---------|------|-------|
| Vite dev server | 8080 | Primary local dev target (`vite.config.ts`) |
| Vite preview | 4173 | After `npm run build` → `npm run preview` |

Hosted Supabase (`VITE_SUPABASE_URL` in `.env`) is required for auth, community, UGC, and messaging. AniList and trace.moe are external APIs used from the browser.

### Common commands

See `package.json` scripts:

- **Dev:** `npm run dev`
- **Lint:** `npm run lint` (pre-existing warnings/errors in the codebase; does not block build)
- **Build:** `npm run build`
- **Preview:** `npm run preview`

There is no test suite in this repo.

### Gotchas

- **`npm ci` may fail** if `package-lock.json` is out of sync with `package.json` (e.g. after `react-markdown` was added). Use `npm install` instead.
- **Lockfiles:** Both `package-lock.json` and `bun.lock`/`bun.lockb` exist; README uses **npm**.
- **Barint AI** needs the deployed Supabase edge function `barint-chat` and `LOVABLE_API_KEY` on Supabase — not required for browse/search/rankings.
- **No git hooks** are configured (only sample hooks in `.git/hooks/`).

### Hello-world verification

1. `npm run dev` → open http://localhost:8080/
2. Confirm home page loads anime carousels (AniList API)
3. Search for an anime (e.g. "Naruto") and open a detail page

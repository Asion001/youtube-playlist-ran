# YouTube Playlist Ranker

Rank videos from a YouTube playlist using pairwise comparisons and Elo-style scoring.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Cloudflare Worker Proxy

Playlist HTML is fetched through a Cloudflare Pages Function at:

- `functions/api/proxy.ts`
- Cloudflare Worker equivalent: `workers/proxy.js` (deployed via Wrangler)
- Access is restricted to configured page origins via `ALLOWED_ORIGINS`.

The frontend uses `/api/proxy?playlistId=...` by default, and you can override it with:

- `VITE_PROXY_URL`

## Deploy to Cloudflare Pages and Workers

This repository includes:

- `wrangler.toml` with Pages output configured as `dist`
- `wrangler.worker.toml` for Worker deployment config
- GitHub Actions workflow at `.github/workflows/pages.yml` for build + deploy (via `cloudflare/wrangler-action`)

### One-time setup

1. Create a Cloudflare Pages project (name can match this repo, or any existing Pages project name).
2. In GitHub repository secrets, add:
   - `CLOUDFLARE_API_TOKEN` (Pages + Workers edit permission)
   - `CLOUDFLARE_ACCOUNT_ID`
3. In GitHub repository variables, optionally add:
   - `CLOUDFLARE_PROJECT_NAME` (required if your Pages project name differs from the repository name)
4. Set `ALLOWED_ORIGINS` in `wrangler.toml` to your production page origins.

### CI/CD behavior

- Pull requests to `main` run `npm ci` and `npm run build`.
- Pushes to `main` run build, copy `functions/` into `dist/functions/`, deploy to Cloudflare Pages via Wrangler, and deploy to Cloudflare Workers via Wrangler.

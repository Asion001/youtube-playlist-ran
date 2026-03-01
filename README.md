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
- Access is restricted to configured page origins via `ALLOWED_ORIGINS`.

The frontend uses `/api/proxy?playlistId=...` by default, and you can override it with:

- `VITE_PROXY_URL`

## Deploy to Cloudflare Pages

This repository includes:

- `wrangler.toml` with Pages output configured as `dist`
- GitHub Actions workflow at `.github/workflows/pages.yml` for build + deploy

### One-time setup

1. Create a Cloudflare Pages project named `youtube-playlist-ran`.
2. In GitHub repository secrets, add:
   - `CLOUDFLARE_API_TOKEN` (Pages edit permission)
   - `CLOUDFLARE_ACCOUNT_ID`
3. Set `ALLOWED_ORIGINS` in `wrangler.toml` to your production page origins.

### CI/CD behavior

- Pull requests to `main` run `npm ci` and `npm run build`.
- Pushes to `main` run build and deploy `dist` + `functions/` to Cloudflare Pages.

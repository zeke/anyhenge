# AGENTS.md

Keep this file up to date. Whenever you make a meaningful change to the project (stack, scripts, deploy, conventions, gotchas), revise this file in the same change.

## Stack

- Single static page: `public/index.html` (inline CSS and JS, no build step).
- Libraries loaded from CDNs with pinned versions: Leaflet, SunCalc, `@photostructure/tz-lookup`.
- Deployed as a Cloudflare Worker with static assets (`wrangler.jsonc`) to `anyhenge.ziki.boo`.
- `src/index.js` (plain JS, bundled by wrangler) runs first on `/` to rewrite `og:url`/`og:image` via `HTMLRewriter`, and serves `/og.jpg?v=...` as a Browser Run `quickAction('screenshot')` of `https://anyhenge.ziki.boo/?v=...`, cached with the Cache API. Other paths go straight to assets.
- View state lives in the query string: `?v=lat,lng,zoom,doy`. It must not be in the hash, because fragments never reach the server and crawlers would get the same OG image for every link. Legacy `#lat,lng,zoom,doy` links still load and get rewritten to `?v=`.

## Scripts

- `script/dev`: runs `wrangler dev` on 8787 behind browser-sync on 3000 with live reload.
- `npm run deploy`: `wrangler deploy`.
- No tests, linter, or typecheck are configured.

## Gotchas

- CARTO raster basemaps require an API key (`?key=`). The key in `index.html` is Referer-restricted to `anyhenge.ziki.boo`, so local dev shows "API KEY REQUIRED" watermark tiles. CARTO requires `localhost` to be on a separate key; if one is added, pick it by `location.hostname`. Test with `curl -H 'Referer: https://anyhenge.ziki.boo/'`.
- `quickAction()` doesn't work in local mode, so the browser binding has `"remote": true`. `wrangler dev` then needs real auth; if it says the remote session couldn't be authenticated, unset the stray `CLOUDFLARE_API_KEY`/`CLOUDFLARE_ACCOUNT_ID`/`CLOUDFLARE_SUPERTOKEN`/`CLOUDFLARE_API_TOKEN` env vars. The screenshot always loads the production origin, so local `/og.jpg` renders whatever is deployed.
- The screenshot browser has geolocation, so its location dot can show up in OG images of views near the Browser Run datacenter.
- Sunset times are formatted in the map center's IANA time zone (via `tzlookup`), not the viewer's. Wrap longitude (`latLng.wrap()`) before calling `tzlookup`, since Leaflet can report values outside ±180.

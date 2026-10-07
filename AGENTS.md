# AGENTS.md

Keep this file up to date. Whenever you make a meaningful change to the project (stack, scripts, deploy, conventions, gotchas), revise this file in the same change.

## Stack

- Single static page: `public/index.html` (inline CSS and JS, no build step).
- Libraries loaded from CDNs with pinned versions: Leaflet, SunCalc, `@photostructure/tz-lookup`.
- Deployed as a Cloudflare Worker with static assets (`wrangler.jsonc`) to `anyhenge.ziki.boo`.

## Scripts

- `script/dev`: runs `wrangler dev` on 8787 behind browser-sync on 3000 with live reload.
- `npm run deploy`: `wrangler deploy`.
- No tests, linter, or typecheck are configured.

## Gotchas

- CARTO raster basemaps require an API key (`?key=`). The key in `index.html` is Referer-restricted to `anyhenge.ziki.boo`, so local dev shows "API KEY REQUIRED" watermark tiles. CARTO requires `localhost` to be on a separate key; if one is added, pick it by `location.hostname`. Test with `curl -H 'Referer: https://anyhenge.ziki.boo/'`.
- Sunset times are formatted in the map center's IANA time zone (via `tzlookup`), not the viewer's. Wrap longitude (`latLng.wrap()`) before calling `tzlookup`, since Leaflet can report values outside ±180.

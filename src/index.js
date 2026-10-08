// Serves static assets, injects per-view OpenGraph tags on `/?v=...`,
// and renders `/og.jpg?v=...` as a screenshot of that view via Browser Run.

const ORIGIN = 'https://anyhenge.ziki.boo';

// Manhattanhenge (May 29) for links without a view
const DEFAULT_VIEW = '40.7549,-73.9840,13,148';

// lat,lng,zoom,doy  e.g. 37.8654,-122.2963,17,296
const VIEW_RE = /^-?\d{1,3}(\.\d+)?,-?\d{1,3}(\.\d+)?,\d{1,2},\d{1,3}$/;

function getView(url) {
  const v = url.searchParams.get('v');
  return v && VIEW_RE.test(v) ? v : null;
}

async function ogImage(request, env, ctx) {
  const view = getView(new URL(request.url)) ?? DEFAULT_VIEW;
  const cacheKey = new Request(`${ORIGIN}/og.jpg?v=${view}`);
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const shot = await env.BROWSER.quickAction('screenshot', {
    url: `${ORIGIN}/?v=${view}`,
    viewport: { width: 1200, height: 630, deviceScaleFactor: 2 },
    gotoOptions: { waitUntil: 'networkidle0', timeout: 30000 },
    addStyleTag: [{ content: '.leaflet-control-zoom { display: none; }' }],
    screenshotOptions: { type: 'jpeg', quality: 80 },
  });
  if (!shot.ok) return shot;

  const response = new Response(shot.body, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=604800',
    },
  });
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

async function page(request, env) {
  const response = await env.ASSETS.fetch(request);
  const view = getView(new URL(request.url));
  if (!view) return response;

  return new HTMLRewriter()
    .on('meta[property="og:url"]', {
      element(el) { el.setAttribute('content', `${ORIGIN}/?v=${view}`); },
    })
    .on('meta[property="og:image"]', {
      element(el) { el.setAttribute('content', `${ORIGIN}/og.jpg?v=${view}`); },
    })
    .transform(response);
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === '/og.jpg') return ogImage(request, env, ctx);
    if (pathname === '/') return page(request, env);
    return env.ASSETS.fetch(request);
  },
};

# Anyhenge

A single-page web app that shows the sun's azimuth as a live line on a map,
letting users visually see when the sun aligns with any street grid — the
"henge" moment.

Named after Manhattanhenge, the twice-yearly event where the setting sun aligns
with Manhattan's street grid.

## What it does

- Centers the map on the user's geolocation (browser API)
- Draws a pulsing blue dot at the user's real-world location
- Draws a sun azimuth line through the **map center**, extending to the edges of
  the visible viewport regardless of zoom level
- As the user pans, the line recalculates from the new map center lat/lng
- Two sliders let the user scrub through any date and time of day
- The line dims when the sun is below the horizon

## Interface

Full-viewport Leaflet map with a floating bottom control panel.

```
┌─────────────────────────────────────────┐
│                                         │
│          Leaflet map (full)             │
│     [sun azimuth line through center]   │
│                   +                     │
│                                         │
├─────────────────────────────────────────┤
│  Anyhenge  date slider   time slider    │
│  lat, lng  azimuth: 247°  alt: +3.2°   │
└─────────────────────────────────────────┘
```

A small crosshair at the map center makes the pivot point of the line visible.

## Controls

- **Date slider** — Jan 1 through Dec 31 of the current year
- **Time slider** — full 24 hours, 1-minute steps, initialized to solar noon
- **Readout** — current date/time, sun azimuth (compass degrees), sun altitude
  (positive = above horizon, negative = below)

## Libraries (CDN, no API keys required)

- Leaflet 1.9.4 — map and tile rendering
- SunCalc 1.9.0 — sun position calculations
- CartoDB Dark Matter — tile layer (dark background makes the sun line pop)

## Sun line behavior

- Pivots from the map center lat/lng
- Extends dynamically to always bleed off the edges of the viewport, using
  `map.getBounds()` to compute a sufficiently long distance at the current zoom
- Color: gold/amber (#f59e0b) when sun is above horizon, dim gray (#4b5563) when
  below
- Recalculates on: either slider move, map pan end, map zoom end

## Core algorithm

```js
// Sun position
const pos = SunCalc.getPosition(datetime, centerLat, centerLng)

// Convert SunCalc azimuth (south=0, west=+, radians) to compass bearing
const bearing = (pos.azimuth * 180 / Math.PI + 180) % 360

// Altitude in degrees (positive = above horizon)
const altitude = pos.altitude * 180 / Math.PI

// Extend line far enough to always exit the viewport
// Use diagonal of current bounds * 2 as the distance
const bounds = map.getBounds()
const diagKm = bounds.getNorthWest().distanceTo(bounds.getSouthEast()) / 1000
const dist = diagKm * 1.5

// Spherical destination formula for forward and back endpoints
function destPoint(lat, lng, bearingDeg, distKm) { ... }
const p1 = destPoint(centerLat, centerLng, bearing, dist)
const p2 = destPoint(centerLat, centerLng, (bearing + 180) % 360, dist)
```

## File structure

Single file: `index.html` — all HTML, CSS, and JS inline.

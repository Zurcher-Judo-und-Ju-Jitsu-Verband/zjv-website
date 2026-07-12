---
name: mitglieder-map
description: "Build the ZJV Mitglieder map: geocode dojo addresses, fetch Bezirk/canton boundary GeoJSON from geo.admin.ch, convert to SVG overlays, and fetch a Swisstopo WMS base map — all aligned to a shared bounding box."
---

# Mitglieder Map

Builds the layered map for `zjv/mitglieder/`: a Swisstopo base image, SVG region overlays, and club markers derived from `mitglieder.json`. All layers share a common bounding box and pixel projection.

## Bounding Box

Derived from actual club `lat`/`lng` positions in `mitglieder.json`, with **10% relative padding** on all sides (i.e. 10% of the coordinate range added to each edge).

| Parameter | Value |
|-----------|-------|
| `LAT_MIN` | 46.97 |
| `LAT_MAX` | 47.78 |
| `LNG_MIN` | 8.00  |
| `LNG_MAX` | 9.55  |
| Image width | 900 px |
| Image height | 650 px |

To recompute from `mitglieder.json`:
```python
import json
with open("zjv/mitglieder/mitglieder.json") as f:
    data = json.load(f)
lats = [c["lat"] for c in data["mitglieder"]]
lngs = [c["lng"] for c in data["mitglieder"]]
pad_lat = (max(lats) - min(lats)) * 0.10
pad_lng = (max(lngs) - min(lngs)) * 0.10
print(f"lat {min(lats)-pad_lat:.4f}–{max(lats)+pad_lat:.4f}, lng {min(lngs)-pad_lng:.4f}–{max(lngs)+pad_lng:.4f}")
```

---

## 1. Geocoding Dojo Locations

Uses [Nominatim](https://nominatim.openstreetmap.org/) (OpenStreetMap geocoder). No API key required. Rate limit: 1 request/second. Requires a descriptive `User-Agent` header.

**Strategy:** try full dojo address first; fall back to PLZ + Ort if Nominatim can't resolve venue names ("Schulhaus …", "Turnhalle …").

Results are written back to `mitglieder.json` as `lat`/`lng` fields (6 decimal places).

```python
import json, urllib.request, urllib.parse, time

MITGLIEDER_PATH = "zjv/mitglieder/mitglieder.json"
headers = {"User-Agent": "ZJV-Website-Geocoder/1.0 (zjv.ch)"}

with open(MITGLIEDER_PATH) as f:
    data = json.load(f)

for club in data["mitglieder"]:
    if "lat" in club:
        continue
    for query in [
        f"{club['adresse']}, {club['plz']} {club['ort']}, Switzerland",
        f"{club['plz']} {club['ort']}, Switzerland",  # fallback
    ]:
        url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
            {"q": query, "format": "json", "limit": 1, "countrycodes": "ch"}
        )
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers)) as r:
            results = json.loads(r.read())
        if results:
            club["lat"] = round(float(results[0]["lat"]), 6)
            club["lng"] = round(float(results[0]["lon"]), 6)
            break
        time.sleep(1.1)
    time.sleep(1.1)

with open(MITGLIEDER_PATH, "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
```

**Known fallbacks (PLZ centroid, not exact dojo):**
Judo Club Kloten, Judo-Sport Club Dietikon, Judo-Club Wetzikon, Judo Club O-NAMI Horgen, Judoclub Sihltal, Judo + Ju-Jitsu Club Glarus, Judoclub Yawara Glarnerland, Budo Club March, Judoclub-Kaltbrunn, JC Tsukuri, Judo Club Uster, JJC Dübendorf, JJC Winterthur, JSCZ Zürich, Polizei-JJC Zürich.

---

## 2. WMS Base Map

**Chosen layer:** `ch.swisstopo.leichte-basiskarte_reliefschattierung` — Swisstopo light basemap with relief shading. Subtle terrain, muted colours, no road clutter. Selected after comparing against `pixelkarte-farbe`, `pixelkarte-grau`, `leichte-basiskarte_reliefschattierung_monochrom`, and boundary-only layers.

The base map is stored as `js/zjv-mitglieder-karte/map.png` (900×650 px). Fetch it fresh with:

```bash
curl -o js/zjv-mitglieder-karte/map.png \
  "https://wms.geo.admin.ch/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap\
&LAYERS=ch.swisstopo.leichte-basiskarte_reliefschattierung\
&CRS=EPSG:4326&BBOX=46.97,8.00,47.78,9.55\
&WIDTH=900&HEIGHT=650&FORMAT=image/png&STYLES="
```

If the bounding box changes, update `BBOX=LAT_MIN,LNG_MIN,LAT_MAX,LNG_MAX` accordingly (note: WMS BBOX order for EPSG:4326 is **lat_min, lng_min, lat_max, lng_max**).

Alternative layers tried (swap `LAYERS=` value):
- `ch.swisstopo.pixelkarte-farbe` — full-colour topographic, too busy
- `ch.swisstopo.pixelkarte-grau` — greyscale topographic
- `ch.swisstopo.leichte-basiskarte_reliefschattierung_monochrom` — monochrome relief only
- `ch.swisstopo.leichte-basiskarte_reliefschattierung,ch.swisstopo.swissboundaries3d-bezirk-flaeche.fill` — relief + Bezirk boundaries baked in (boundary colour not customisable)

---

## 3. Fetching Boundary GeoJSON

Uses the geo.admin.ch REST MapServer `find` endpoint. Returns ESRI JSON with `rings` in WGS84 (`sr=4326`).

**Zürich Bezirke** (layer: `ch.swisstopo.swissboundaries3d-bezirk-flaeche.fill`):
Affoltern, Andelfingen, Bülach, Dielsdorf, Dietikon, Hinwil, Horgen, Meilen, Pfäffikon, Uster, Winterthur, Zürich

**Outer cantons** (layer: `ch.swisstopo.swissboundaries3d-kanton-flaeche.fill`):
Glarus, Schaffhausen, Schwyz, St. Gallen

```python
import urllib.request, json, urllib.parse

def fetch_feature(layer, name):
    url = (
        "https://api3.geo.admin.ch/rest/services/api/MapServer/find"
        f"?layer={layer}&searchText={urllib.parse.quote(name)}&searchField=name"
        "&returnGeometry=true&sr=4326"
    )
    with urllib.request.urlopen(url) as r:
        return json.loads(r.read()).get("results", [])
```

ESRI rings → GeoJSON: first ring = exterior, subsequent = holes.

```python
def esri_to_geojson(rings):
    if len(rings) == 1:
        return {"type": "Polygon", "coordinates": rings}
    return {"type": "MultiPolygon", "coordinates": [[r] for r in rings]}
```

Output files: `zjv/mitglieder/bezirk-{slug}.geojson`, `kanton-{slug}.geojson`.
Umlaut slugs: ü→ue, ö→oe, ä→ae (e.g. `bezirk-buelach`, `bezirk-zuerich`, `bezirk-pfaeffikon`).

---

## 4. Generating SVG Overlays

Each GeoJSON → standalone SVG with `viewBox="0 0 900 650"`, aligned to the WMS image.

**Projection** (linear, y-axis flipped for SVG):
```python
# Bounding box — 10% relative padding on all sides of club extents
LAT_MIN, LAT_MAX = 46.97, 47.78
LNG_MIN, LNG_MAX = 8.00, 9.55
W, H = 900, 650

def project(lng, lat):
    x = (lng - LNG_MIN) / (LNG_MAX - LNG_MIN) * W
    y = (LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * H
    return round(x, 1), round(y, 1)
```

**Douglas-Peucker simplification** (`epsilon=1.5` px):
```python
import math

def simplify(pts, epsilon=1.5):
    if len(pts) < 3:
        return pts
    def pdist(p, a, b):
        dx, dy = b[0]-a[0], b[1]-a[1]
        if dx == dy == 0:
            return math.hypot(p[0]-a[0], p[1]-a[1])
        return abs(dy*p[0] - dx*p[1] + b[0]*a[1] - b[1]*a[0]) / math.hypot(dx, dy)
    dmax, idx = max((pdist(pts[i], pts[0], pts[-1]), i) for i in range(1, len(pts)-1))
    if dmax >= epsilon:
        return simplify(pts[:idx+1], epsilon)[:-1] + simplify(pts[idx:], epsilon)
    return [pts[0], pts[-1]]
```

SVG template per feature:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 650" width="900" height="650">
  <path id="{slug}" d="{path_data}"
        fill="rgba(0,80,160,0.15)" stroke="#0050a0"
        stroke-width="1.5" stroke-linejoin="round"/>
</svg>
```

Output files: `zjv/mitglieder/bezirk-{slug}.svg`, `kanton-{slug}.svg`.

---

## 5. Club Marker Positions

Convert `lat`/`lng` from `mitglieder.json` to pixel coordinates using the same `project()` function. Place as absolutely-positioned `<div>` elements over the map canvas.

```javascript
// Bounding box — 10% relative padding on all sides of club extents
const LAT_MIN = 46.97, LAT_MAX = 47.78, LNG_MIN = 8.00, LNG_MAX = 9.55;
const W = 900, H = 650;

function project(lng, lat) {
    return {
        x: (lng - LNG_MIN) / (LNG_MAX - LNG_MIN) * W,
        y: (LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * H,
    };
}
```

---

## Output Files Summary

All stored in `zjv/mitglieder/`:

| File | Description |
|------|-------------|
| `mitglieder.json` | Club data with `lat`/`lng` geocoded |
| `js/zjv-mitglieder-karte/map.png` | WMS base map image (fetch with curl, not in git) |
| `js/zjv-mitglieder-karte/boundaries.svg` | Combined Bezirk/canton SVG overlay |
| `bezirk-{slug}.geojson` / `.svg` | Zürich Bezirk boundaries |
| `kanton-{slug}.geojson` / `.svg` | Outer canton boundaries |

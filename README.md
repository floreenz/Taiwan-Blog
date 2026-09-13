# Two Bodies / Taiwan

A dependency-free static prototype for a spatial scan archive. It is designed
for GitHub Pages: the archive is `index.html`, and every entry opens as a
standalone 3D room at `room.html?room=<slug>`.

## Run locally

Use any static web server from the repository root, for example:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`. Fetching `rooms.json` requires serving the files
rather than opening the HTML files directly.

## Try a scan

Open a room and select **PLY**. The prototype displays ASCII and binary
little-endian PLY files with `x`, `y`, `z`, and optional `red`, `green`, `blue`
vertex properties. These RGB vertex colors provide the photographic appearance
of most Record3D point-cloud exports. PLY files with a separate image texture
(UV texture) are not supported; export those scans as compressed GLB instead.

For this prototype, keep a published PLY at or below **20 MB** and **250,000
source points**. It renders a representative maximum of 60,000 points to keep
interaction smooth on ordinary laptops and current phones. Crop the scan to the
interesting space and decimate it before publishing; retain the original scan
privately. This is intentionally a first visual/interaction study, not yet a
tiled point-cloud streamer.

## Add a room

Add its metadata to `rooms.json`, then publish the room URL:

```text
room.html?room=your-new-slug
```

The current room scene is generated sample geometry so the site works before
real scans are available. The next production step is to add a `scan` field per
entry, publish processed PLY/GLB/splat assets to object storage, and
progressively load them by room.

## Deploy to GitHub Pages

The included workflow deploys the archive whenever `main` changes. In the
repository's **Settings → Pages**, select **GitHub Actions** as the deployment
source once. The published archive is then available at the repository's Pages
URL.
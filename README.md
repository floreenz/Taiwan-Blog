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

Open a room and select **Try your PLY scan**. The prototype displays ASCII and
binary little-endian PLY files with `x`, `y`, `z`, and optional `red`, `green`,
`blue` vertex properties. Large, raw scans should be cropped and decimated
before publication; this prototype is intentionally a first visual/interaction
study, not yet a tiled point-cloud streamer.

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
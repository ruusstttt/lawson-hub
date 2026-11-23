# Lawson Hub

Creative tools for The Lawson Show, together in one browser workspace.

**Open the site:** https://ruusstttt.github.io/lawson-hub/

**Repository:** https://github.com/ruusstttt/lawson-hub

- **NFL Exporter:** schedule import, editable spreads and picks, six overlay styles, full-resolution 1920 × 200 PNGs and round ZIPs. Ten advertising campaigns include both blue Polymarket/LAWSON designs with their original QR codes and terms.
- **Thumbnails:** the existing thumbnail builder, with 55 John photos, 35 logos, team presets, uploads and 1280 × 720 or 2560 × 1440 PNG export.

Switching tabs keeps both editors open. NFL rounds also save in the current browser and can be exported/imported as JSON. Thumbnail changes and uploaded images last for the current page session; export before reloading.

## Open locally

Install Node.js 22 or newer, open this folder and run `npm start`, then open http://127.0.0.1:4173. On Windows, double-click `Start-Lawson-Hub.cmd`. No dependency installation is needed. Keep the server window running while using the site.

Use an HTTP server; opening `site/index.html` directly as a file does not support the Hub's JavaScript modules.

## Folder structure

| Folder | Purpose |
| --- | --- |
| `site/` | The complete static website, including assets |
| `site/exporter/` | Browser version of the NFL exporter |
| `site/thumbnails/` | Existing thumbnail renderer with Hub styling and shared download controls |
| `site/tools.mjs` | Registry of tabs; add future tools here |
| `originals/nfl-exporter/` | Local archive of the updated Windows exporter, source and Polymarket Blue EXE |
| `originals/thumbnails/` | Local archive of the existing thumbnail project |
| `tests/` | Schedule validation, asset and ZIP tests |

The `originals/` archive is intentionally excluded from Git and site deployment. It is included in the local consolidated folder. Original working folders were copied, not moved or modified. `originals/SHA256.json` records source fingerprints.

## Add a tool

Create `site/your-tool/index.html` and add one entry to `site/tools.mjs` with a unique `id`, `name`, `short`, relative `src` and `description`. The Hub creates its tab automatically and keeps the editor loaded when another tab is selected. Use relative asset paths so deployment under `/lawson-hub/` works.

## GitHub Pages

The workflow `.github/workflows/pages.yml` tests and publishes only `site/` on pushes to `main`. Configure the repository's Pages source as **GitHub Actions**. There is no backend, API key or server-side database. User-uploaded photos are processed in the browser.

The schedule loader uses ESPN, then nflverse when available; both are external services and may change. Manual matchups and saved JSON remain available when schedule providers fail. Historical playoff and preseason fixtures have different structures; automated validation is covered, but every historical round has not been checked live.

## Rendering and verification

Run `npm test` for schedule parsing, phase mapping, invalid-round rejection, fallback/cache behavior, asset dimensions, tool entries and ZIP integrity. See `VERIFICATION.md` for the dated scope of checks.

Advertising PNGs are served without re-encoding. The thumbnail drawing engine and bundled images are preserved. The NFL renderer was ported from Windows drawing to browser Canvas: it uses the original backgrounds and logo geometry, but text antialiasing, shadows and the reconstructed Legacy Compact background can differ from the EXE. This is not a pixel-identical GDI+ emulator.

The project contains the user's supplied brand, team and photographic assets for the requested Lawson workflow; no ownership or third-party asset license is implied by this repository.

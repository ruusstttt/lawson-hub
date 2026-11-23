# Verification — 2026-11-23

- `npm test`: 15 tests passed, covering schedule validation, phase mapping, fallback/cache behavior, invalid and duplicate teams, tool paths, six layout assets, 32 teams, ten campaign dimensions and ZIP payload preservation.
- Live browser check: ESPN returned 15 games for the 2026 regular season, week 9. Edited the first game's spread/pick, switched Hub tabs and reloaded; the round and edited values were retained.
- Browser Canvas rendered the original template assets, and individual PNG and 15-game ZIP generation completed without reported errors. A persistent download link remains available after generation.
- Downloaded the horizontal Polymarket PNG through the browser. Original campaigns are published as unchanged files.
- Thumbnail library reported 55 photos and 35 logos. Edited the week, selected Baltimore Ravens, and generated a 1280 × 720 PNG. Drawing code remains the existing builder's renderer; Hub chrome and download behavior were adapted.
- Inspected Hub at narrow and 1440 × 1000 desktop widths. Tables scroll horizontally at narrow widths. Desktop advertising screenshot retained locally in `test-output/`.
- Known test limitation: the embedded preview browser cannot retrieve Blob downloads from iframes, and its top-level Blob download wait timed out. Generation success was observed, but receipt of generated PNG/ZIP files on disk was not verified through that preview tool. Direct campaign PNG download succeeded. Recheck generated downloads in a regular browser after deployment.
- Windows EXE was copied from the prior verified 4.1.2.0 delivery; it was not rebuilt or rerun in this web-port task. QR readability at final broadcast size and on a physical phone was not repeated.
- The web renderer can differ from Windows GDI+ text antialiasing, shadows and Legacy Compact drawing. Advertising PNGs remain byte-identical; they are not re-rendered.

This records the checked scope, not a claim that every historical schedule, browser or device has been tested.

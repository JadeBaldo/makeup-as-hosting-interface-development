# Pre-performance checkpoint ? 15 October 2026

This freezes the final interaction and subtitle changes **before performance tuning and the live rehearsal pass**. It does not certify show-machine performance.

- [Standard performance](performance-metal/): current primary version.
- [Smooth preview](performance-smooth/): same interaction and appearance settings, with reduced duplicate CPU/canvas work. No measured FPS improvement is claimed.
- [Decisions](DECISIONS.md): final choices and rationale.
- [Validation and remaining checks](VALIDATION.md): what was checked and what remains unverified.
- [Source checksums](SOURCE-SHA256.json): exact frozen application files, independent of the earlier ZIP checkpoints.

## Run

From this directory:

```sh
python -m http.server 8772 --bind 127.0.0.1
```

Open http://127.0.0.1:8772/performance-metal/ or http://127.0.0.1:8772/performance-smooth/. Use a current Chrome browser with hardware acceleration. Three.js/fonts are bundled; MediaPipe code, WASM and models require internet. Camera access requires localhost or HTTPS.

## Operate

Start webcam requests camera permission, loads tracking and starts recording. In Rehearsal mode, use Start recording explicitly. Face-local finger tracing or the calibrated brush proxy drives material deformation. Brush mode estimates a held tip; it does not recognize an actual brush or detect makeup.

Open a broadside hand for about 0.22 seconds, then close it into a fist within two seconds and hold briefly (about 0.12 seconds). This captures the outgoing slide, then advances one slide and clears its marks and deformation. Recording restarts before packaging finishes. A held fist does not repeat; reopen to rearm. Tracking loss disarms. Capture now uses the same capture/advance path. Opening the hand alone does not advance.

Each download contains six files: rendered PNG, deformed world-space OBJ, base-material MTL, AR video, webcam-only video, and JSON metadata. AR images/video include the readable bottom text; webcam-only video excludes it. OBJ/MTL do not reproduce shader masks, reflections or face cutouts. Audio is not recorded. Allow downloads; Save last capture again retries the latest ZIP in memory. Reloading discards unsaved video and the in-memory retry copy.

The Growth duration control accepts 0?6 minutes in 0.1-minute steps, default 6. Zero makes global growth immediate once activated. Growth starts on an accepted letter mark or timeline inspection. Changing duration preserves relative buildup position; the local 24-second reaction cycle is unchanged. The global buildup is followed by a 12-second hold and a 60-second return; the next slide is built at the start of that return. Manual capture/navigation starts a fresh slide instead.

The bottom white italic text contains **all title text plus its subtitle**, independent of 3D deformation. Subtitle size is 6?36 CSS pixels, default 22; automatic fitting can reduce it further to keep all text within at most two lines. Screen and AR capture share the fitting helper. H hides controls while keeping subtitles; F toggles fullscreen; arrows navigate; R resets; C clears drawing strokes. Slide changes clear marks and rebuild material fields.

Save text updates the current title/subtitle; Add slide appends one. Programme edits persist in this browser's localStorage for the exact origin. Different hostnames, ports, devices or browsers do not share them. The committed defaults are not a backup of browser-edited programme data; keep an exported capture JSON containing the intended programme.

## History and recovery

This dated directory is the authoritative source for this checkpoint. Application directories contain historical notes/reports from earlier studies; their old timing, palm navigation and same-slide capture descriptions are superseded here. The earlier 11 October freezes remain in Git history and their existing directories.

Check out branch `performance-checkpoint-2026-10-15` or tag `performance-preflight-2026-10-15`. Future tuning should use a new branch. Restore into a separate directory and verify SOURCE-SHA256.json before rehearsing. The standard and smooth versions share an origin and therefore programme storage when served together.

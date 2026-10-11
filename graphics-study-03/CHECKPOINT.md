# Study 03 — Inexhaustible Slime checkpoint

Saved 11 October 2026 for Altered Images. This is a separate graphics experiment, not a modification of the integrated webcam performance.

## Approved direction and reasoning

Jade identified this iteration as a useful direction. The material is a reflective, liquid-metal covering containing viscous slime. Its interior is an impossible inexhaustible source: rupture exposes slime that keeps draining without emptying. Uneven bubbling and partial dissolution of the covering suggest a violent chemical reaction; restrained rising vapour supports it. The deflated carcass was rejected as the current finish, but that earlier Blender proposal remains available for comparison.

The underlying R, its internal opening and some covering remain visible. This is art-directed geometry, shader holes and procedural emission, not a conservation-based fluid simulation. A fixed number of droplets and thread points are reused; one pool grows instead of storing unlimited particles.

## Open the current work

- **Latest Blender scene:** `blender/output/altered-r-chemical-study.blend`. Open in Blender 5.2, hover over the viewport and press Space. The timeline has 60 seconds; frame 253 marks rupture. Procedural emission remains active beyond the original 18-second keyed excerpt.
- **Rendered review:** `blender/review.html`, with `blender/output/chemical-preview.mp4` and six stage images. From this folder run `python -m http.server 8772 --bind 127.0.0.1`, then open `http://localhost:8772/blender/review.html`.
- **Preserved browser Study 03:** `index.html` at the same server root. Its existing interaction and six-minute buildup remain unchanged. It still has the earlier collapse/fall graphics; the chemical proposal is not integrated into it.

The Blender clip is accelerated inspection: rupture at 10.5 seconds, not a six-minute performance. The browser study uses a true 360-second buildup. Do not interpret the preview timing as a new performance decision.

## What is preserved

- Browser geometry, shared accumulating trace field, deformation/material code, controls, bundled Three.js and font, tests and verification screenshots.
- Blender source geometry JSON, static authoring scene, shape-key GLB, earlier motion/deflation proposal, intermediate boiling proposal, current chemical scene and rendered previews.
- Every authoring/animation, preparation, verification, rendering and encoding script used, plus reference contact sheets, motion CSVs and observation notes.
- Selected original graphics reference recordings and the illustrated brief in `reference-videos/`. These contain the jelly, bubble-type and softness references, not the integrated webcam recording.
- SHA-256 manifest of checkpoint files. Installer logs, Blender installation binaries, caches, automatic `.blend1` copies and duplicate image-sequence frames are omitted. Frames can be regenerated from the saved scene.

`blender/reference-analysis/analyse.py` originally reads recordings from the author's Desktop/Videos folders. Portable copies now exist in `reference-videos/`; adapt its input paths to those copies on another machine. The script is preserved as used. Browser checks expect Chrome remote debugging on port 9230 and the server on 8772.

## Rebuild and check

Read `blender/README.md` for detailed roles. Run scripts using Blender's executable with `--background --python <script>`:

1. `blender/build-study.py` creates the static source scene, GLB and static previews.
2. `blender/animate-study.py` creates the earlier motion proposal.
3. `blender/chemical-study.py -- --render` creates the current chemical scene and stage renders.
4. `blender/verify-chemical.py` checks materials, finite geometry, open counter, monotonic partial dissolution, no collapse/fall, continuing source and restart. `verify-motion.py` and `verify-export.py` cover the earlier assets.
5. `blender/render-motion.py -- --chemical` renders the 18-second excerpt; `blender/encode-preview.py` uses Blender's bundled H264 encoder.

`prepare-source.mjs` uses the bundled Three.js/font to regenerate the JSON if needed. Browser tests require Node 22.15+; run `node cycle.test.mjs` for the shared-surface and six-minute lifecycle checks.

## Verification at this checkpoint

Blender chemical checks passed, including continuing emission at frames 1000, 2000 and 8000. Six rendered stages and the complete 216-frame, 12-FPS excerpt were inspected. Browser video load, play, pause, seek, loop and restart checks passed without runtime errors. Existing browser deformation/cycle tests passed. All 125 protected integrated/reference files matched their original hashes.

No live webcam rehearsal, real fluid/chemical simulation or integration of the new Blender effect into Three.js was verified. The metal/slime distinction, reaction intensity, motion satisfaction and eventual browser performance still need visual review and development. Cycles lighting does not transfer automatically to Three.js.

## Recovery

This folder is self-contained for opening the scenes and running the browser study. The local checkpoint folder and ZIP contain the same files and manifest. The earlier standalone Blender archive and browser shared-surface archive remain in the original workspace's `saved-versions/`, untouched. The integrated interaction remains on its separate `final-final-interaction-2026-10-11` Git branch.

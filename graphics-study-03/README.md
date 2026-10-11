# Altered Images ? Study 03 graphics pass

Standalone one-letter R experiment. The integrated performance, other studies and saved reference archives are untouched. Uses the existing bundled Three.js/font assets, with no hosted assets or new rendering dependencies.

## Run

Double-click `START-STUDY.bat`, then open http://localhost:8772, or run `python -m http.server 8772` here. Drag on the letter and lift to finish a stroke. Replay clears and repeats the prepared path; Add trace adds the path to the existing skin; Clear resets it. Pause, softness/wobble, reflection/gloss, internal glow and the timeline remain available.

## Shape, surface and timing

One continuous shared field and one reusable membrane mesh accumulate strokes. There is no stroke-count gate during buildup. Pressure saturates smoothly within fixed vertex buffers; strokes are not retained as independent objects or historical paths. The timeline re-evaluates the current accumulated field at a cycle age, rather than reconstructing past drawing history.

Drawing produces a local response immediately, reaching a substantial initial swelling within about 2.2 seconds. Directional pressure follows the deposited stroke direction, causing local pulls and spatially varied bulges. Delayed travelling waves and broad folds make the surface yield without adding spike meshes. Pressure continues developing at the strongest affected point through the entire 360-second buildup. New strokes join that same cycle; they do not restart the clock.

Rupture begins at 360 seconds, not the old 348-second threshold. A local tear and two small droplets accompany rapid collapse (about two seconds). The liquid core disappears, leaving soft residual folds. A weighted descent and damped landing follow, settling by 372 seconds. Nothing clears until Clear/Replay. Drawing closes at rupture. Scrub 359?372 seconds to inspect the transition immediately; the timeline was extended to include the aftermath.

The late whole-letter stretch fits the viewport independently in X and Y, using more of the screen without uniformly enlarging and cropping the whole R. The final form loses height while retaining the counter and a recognisable folded outline. On mobile the landing floor sits above the controls, so the aftermath remains inspectable. This remains a single R, not several letters colliding.

The graphics direction comes from the supplied brief's embedded elastic-type, reflective-gel and bubble-reference images. The existing cobalt body/brighter cyan growth relationship is preserved; this standalone study has no face-mark colour input. Materials add denser reflective depth with reduced flat emission. Locally generated gradient softboxes produce broad shaped highlights without an external HDRI.

## Files

- `topology.mjs`: existing bundled-font geometry subdivision, welded body vertices, rest-coordinate picking and silhouette tests; unchanged in this pass.
- `trace-field.mjs`: fixed-size additive pressure and stroke-direction fields, silhouette-safe deposition, one terminal release event.
- `deformation.mjs`: varied body pulls/bulges, travelling wobble, membrane materials, local tear, residual folds and emptying. Front, bevel and walls share body positions; the luminous core stays inset within the same geometry.
- `study.mjs`: local studio reflections and lighting, pointer input, controls, replay, frame-fitting stretch and weighted landing.
- `performance-cycle.mjs`: 360-second pressure progression and subsequent collapse/fall through 372 seconds.
- `index.html`: existing controls with the timeline extended to include the ending.
- `study.test.mjs`, `cycle.test.mjs`, `browser-check.mjs`: accumulation, geometry, timing and rendered interaction checks.

## Checkpoint and verification

Git was inspected before editing: the workspace contains unrelated staged changes and Study 03 was untracked. Those Git changes were left alone. `checkpoints/study03-before-graphics-pass.zip` is the complete pre-pass source/assets checkpoint, excluding generated verification output. SHA256: `3a545c30ef15382296a8f4a4ec7d7d09a9cef0b6bc86b97a40f6960b57354f08`.

Run `node cycle.test.mjs` for the shared-field and geometry tests. These test 1,000 accepted strokes, constant mesh/buffer sizes, additive pressure, joined front/wall positions, reset/replay, pressure still developing just before 360 seconds, no premature or repeat rupture, collapse and open-counter sample rays during buildup and aftermath.

Run `node browser-check.mjs` with this server on port 8772 and a Chrome debugging endpoint on localhost:9230. The browser checks real pointer drawing and directional deposition, 503 accumulated strokes with one unchanged mesh/triangle count, timeline stages, restrained natural rupture release, reset/replay, landing, stopped clock and a mobile viewport. Captures/results are in `verification/`. Timing was verified directly and the progression inspected by scrubbing; a complete six-minute wall-clock rehearsal was not performed. No accelerated setting is left in the study.

## Limits needing visual rehearsal

Art-directed geometry and shaders approximate gel; there is no full liquid or soft-body collision simulation. Fine tessellation still makes some stretched highlights angular, especially under dense pressure. Counter checks sample specific positions and do not prove every possible trace remains free of self-intersection. The body still reads more opaque and synthetic than the liquid-reference imagery. Jade should judge whether the local stretch, reflection depth, softness and carcass weight achieve the intended feel. Test on the performance GPU/display; emulated mobile rendering is not a phone performance test. Observed browser FPS varied around 30?40 during late active deformation and about 60 once settled. Measured browser FPS is recorded in `verification/browser-results.json`.

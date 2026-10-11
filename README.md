# Altered Images - Final Final Interaction

Frozen on 11 October 2026 before the next graphics pass. Current integrated source: [altered-images-preview](altered-images-preview/). Decisions and rationale: [FINAL-FINAL-INTERACTION.md](altered-images-preview/FINAL-FINAL-INTERACTION.md).

Verified archive: [Final Final Interaction ZIP](saved-versions/altered-images-final-final-interaction-2026-10-11.zip), with its SHA-256 checksum alongside it. The earlier 01.4 and 01.5 reference archives remain preserved. The 01.5 reference is for visual qualities only, not its input mapping.

Run `python serve.py` inside `altered-images-preview/`, then open http://localhost:8001.

The historical development notes below describe the older 01.4/01.5 transition, not the current interaction rules.

# Makeup as hosting interface — graphics development

Development snapshots for Altered Images. This repository documents the move
from **01.4 attached growth graphics** to **01.5 deformation of the letter body**.

## Compare versions

- `aesthetic-01.4`: verified saved preview before the body-deformation change.
- `body-deformation-01.5`: new glyph-body deformation and continuous turning.
- [Graphics changelog](altered-images-preview/CHANGELOG.md): behaviour, tests and limitations.
- `saved-versions/`: exact ZIP backups and SHA-256 checksums.

The first commit preserves the 01.4 baseline. The next commit integrates the
standalone study into the performance preview. Original HTML prototypes remain
in `altered-images-preview/originals/`. The separate B study is in `standalone-study/`.
BASELINE-01.4-SHA256SUMS.json describes original saved baseline file bytes;
the ZIP provides their exact copy regardless of Git line-ending conversion.

## Run the current performance preview

From this repository folder, with Python installed:

```sh
python -m http.server 8001 --bind 127.0.0.1 --directory altered-images-preview
```

Open http://localhost:8001. Rehearse by holding and tracing over the lettering.
Webcam mode still uses fingertip overlap; it does not detect makeup.

For the standalone B study, use a second terminal:

```sh
python -m http.server 8002 --bind 127.0.0.1 --directory standalone-study
```

Open http://localhost:8002. Three.js and fonts are bundled; webcam models require
internet. No camera recordings or performance footage are stored here.

## What changed in 01.5

Each letter turns subtly around its own centre with a different speed and phase.
Tracing swells actual front/bevel/wall/outline geometry continuously. Outside
contours expand; holes narrow. Retracing builds pressure; rupture leaves warped,
collapsed material and falling pieces. Deformation freezes on lift while
rotation and falling continue. Picking follows the moving, deformed surface.

Titles retain saturated base colours; growth uses a brighter stroke colour.
Opacity affects painted/swollen areas locally. Slide changes reset letters and
loose fragments, preserving accumulated coloured 3D strokes. C clears strokes;
R resets all; H hides controls; F toggles fullscreen; arrows change slide.

Tests cover all programme glyphs, independent motion, picking, rupture/falling,
connected joins, contour deformation, freezing, reset, colours and stroke retention.
Six main suites and standalone geometry checks pass. Visual rendering, webcam
and projector appearance still need rehearsal; no visual verification is claimed.

No real topology merging, collision solver, makeup detection, dual-camera input,
recording or fluid simulation. Extreme growth may self-intersect. Constructing
dense glyphs can briefly pause slide changes.

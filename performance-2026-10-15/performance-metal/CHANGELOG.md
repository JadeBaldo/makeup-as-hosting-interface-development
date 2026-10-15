# Graphics development history

## 01.5 — letter-body deformation and continuous turning (10 October 2026)

- Replaces attached stalk-like jets with stroke-driven swelling of actual glyph
  fronts, bevels, walls and contours. Shared boundaries remain connected.
- Outside edges expand; inside openings narrow. Retracing increases swelling.
  Rupture leaves a collapsed/distorted footprint and falling material.
- Each glyph has a fixed local centre and different gentle rotation speed/phase.
  Turning continues without drawing; attached deformation freezes on release.
- Raycasts moving, deformed letters and maps hits to original material
  coordinates. Mouse rehearsal and webcam fingertip interaction use this path.
- Saturated text and local brighter stroke-coloured growth replace global
  title colour blending. Growth opacity is local to painted/swollen vertices.
- Slide changes reset lettering and loose fragments, retaining accumulated
  coloured 3D strokes. Clear strokes and Reset all remain separate.
- Resize/fullscreen refits existing glyphs instead of rebuilding their state.
- Standalone B study also gains continuous turning; it remains a separate demo.

Validation: six main suites pass, including all six programme titles and their
glyphs, independent turning, raycasting, rupture/falling, boundary continuity,
silhouette/opening changes, local colours, opacity routing and stroke retention.
Standalone geometry tests and changed-module syntax checks pass. No rendered
visual inspection is claimed. Webcam/projector rehearsal is still required.

Limitations: fixed topology, potential self-intersections at extreme growth,
rest-space brush widths, and some title-construction cost during slide changes.
No makeup detection, recording, dual-camera coordination or fluid solver.

## 01.4 — preserved aesthetic baseline (10 October 2026)

- Larger centred extruded titles and attached rounded jet growths.
- Metallic materials and studio reflection lighting.
- Opaque text, with an independent opacity control for growths.
- Persistent per-slide coloured 3D strokes; separate clear/reset controls.
- Saved as a verified ZIP with SHA-256 checksums before the new body deformation.

The development repository begins with this saved baseline, followed by the
01.5 implementation, so the graphics transition is visible in the Git history.

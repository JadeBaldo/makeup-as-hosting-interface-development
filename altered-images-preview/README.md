# Altered Images - Final Final Interaction

Frozen interaction baseline: **11 October 2026**. The decisions, reasoning, architecture and rehearsal limits are recorded in [FINAL-FINAL-INTERACTION.md](FINAL-FINAL-INTERACTION.md). Preserve this baseline before the next graphics pass.

## Run

Double-click START-PREVIEW.bat on Windows with Python installed, or run `python serve.py` in this folder. Open http://localhost:8001. Keep the terminal open; Ctrl+C stops it. Do not open index.html directly: modules and camera access need localhost.

Three.js and the font are bundled. Webcam tracking downloads MediaPipe 0.10.17 scripts and models; internet is required. Camera frames remain in the browser. Video recording is not included.

## Behaviour

The whole tracked face is one continuous drawing map onto the full current title. The title follows the smoothed face centre, scale, roll and subtle estimated yaw/pitch, with bounds to keep it within the composition. Drawing and marks use the same smoothed face-local frame; the root transform is applied once. Moving the fingertip across the face changes the corresponding material position in the letters. Drawing does not require overlap with the on-screen title. The existing face-local frame follows translation, scale and roll; strong yaw or pitch still needs rehearsal because mapping is a frontal-face approximation with estimated head turns.

Slides change only through manual controls or hand gestures. Hold an open palm entirely outside the padded face area for 0.7 seconds to advance. A small progress indicator shows the hold. Use the left/right arrow keys or manual buttons for previous/next slides; a closed fist no longer navigates. Each gesture triggers once. Return to a clear pointing/neutral/closed pose or release the hand for 0.15 seconds before another palm gesture can trigger. Ambiguous tracking does not re-arm gestures. Index pointing is the drawing pose; ambiguous poses neither draw nor navigate. Navigation poses suppress drawing immediately, including during the hold and after navigation. There is no automatic slide timing.

Active fingertip overlap with the face draws visible strokes and drives deformation. Lifting freezes attached deformation. Slide changes rebuild fresh lettering and clear falling fragments while preserving accumulated face strokes and their colours.

Titles follow the painted face within the composition. Every letter completes one full 360-degree turn around its own local Y axis every six minutes, with a small individual phase offset. The shared elapsed-page-time phase continues while drawing is stopped and across slides; it never advances slides. The existing extruded front, walls and back remain visible through the turn. A genuine Y-axis rotation necessarily presents an edge-on profile twice per cycle and a reversed back view; small phase offsets stagger those moments. Drawing on the face swells its front, bevels, walls and outline along a continuous path. Retracing strengthens the trail; rupture leaves distortion and falling material. Attached deformation freezes on lift, while letter turning and detached falling continue. Text stays saturated; local growth uses a brighter stroke colour. Camera, lettering and growth are fixed at full opacity. Stroke opacity adjusts both existing and new face marks, including their echoes; it does not change deformation strength.

Title size requests up to twice the fit but is bounded to keep the title on screen; Body swelling reaches 3. The old stalk-like jets are no longer used for rendering. Resize/fullscreen changes the title fit without rebuilding or resetting its deformation.

Every gesture-driven or manual slide change resets title deformation and fragments while preserving face marks and their colours. Default stroke colours are fixed per slide. Width and depth affect new strokes. Face-local strokes follow translation, scale and roll; overlays hide when the face is lost. Large head turns require testing.

The latest 192 stroke segments are retained to bound memory. Long strokes split at 512 points. Face strokes accumulate across slides until Clear strokes, Reset all or refresh.

## Controls

- Left/right: previous/next slide, preserving face marks and resetting lettering.
- C / Clear strokes: erase strokes only.
- R / Reset all: clear strokes and the current title deformation, keeping the selected slide.
- H: hide/show controls and hint.
- F: fullscreen; press H separately to hide controls.
- Open palm away from face: next slide after 0.7 seconds. Release before repeating; arrow keys navigate in either direction.

Click the stage before keyboard shortcuts if a control has focus. Slides loop from six to one. Changing camera/rehearsal mode resets title growth and gesture recognition, preserving strokes.

## Titles

1. ALTERED IMAGES / VOL. VII
2. CINEWAVE / Selected Moving Image
3. AUTOJEKTOR
4. JOSÉ MACABRA
5. ARVIN DOLA & IRENE GAUMÉ / O Ghost
6. IMMERSIVE BEATS / Parry Videotapes

Edit state.mjs to change titles. Original prototypes remain in originals/.

## Checks

With Node.js installed: `node --test state.test.mjs surface-study.test.mjs deforming-title.test.mjs strokes.test.mjs face-space.test.mjs jets.test.mjs slow-deformation.test.mjs interaction.test.mjs hand-pose.test.mjs face-motion.test.mjs`.

Checks cover state, finite maximum-growth geometry, frozen growth, resize preservation, face mapping and stroke colour isolation. App/material syntax checks also pass. Camera and projector appearance still need live rehearsal.

No actual makeup detection, fluid simulation, recording, or dual-camera coordination is included. Topology remains fixed: extreme swelling can self-intersect and openings do not actually merge. Glyph geometry construction can briefly pause a slide change; deformation updates only the touched glyph. Camera and projector appearance need rehearsal; no rendered visual verification is claimed for 01.5. The saved 01.4 ZIP remains unchanged.


Slow deformation tuning is in deformation-config.mjs. Duration is active drawing time: lifting freezes the material; new strokes can still affect fresh areas. Post-rupture material retains lateral and depth swelling rather than flattening almost completely.


## Later graphics pass ? not implemented

Bring the integrated lettering closer to the saved 01.5 visual reference: stronger local silhouette warping, path-following blister buildup, rupture and a richer distorted aftermath. Preserve the continuous face-local interaction and the current slow buildup until that graphics pass is agreed. The 01.5 archive is a visual reference only; do not restore its requirement for fingertip overlap with the letters. No makeup-colour detection is included in this interaction pass.


## Future 3D export ? not implemented

A later iteration should export the performance as a 3D scene, providing the title, deformation and face marks as separate elements and as a combined scene. This patch adds no export or makeup-colour detection. The 01.5 archive remains a visual reference for the later graphics pass only.

# Altered Images — aesthetic preview 01.4

Saved 10 October 2026. Mirrored webcam, six programme titles, opaque metallic lettering, soft glossy growths, and accumulated coloured 3D strokes. Makeup detection is deferred.

## Run

Double-click START-PREVIEW.bat on Windows with Python installed, or run `python serve.py` in this folder. Open http://localhost:8765. Keep the terminal open; Ctrl+C stops it. Do not open index.html directly: modules and camera access need localhost.

Three.js and the font are bundled. Webcam tracking downloads MediaPipe 0.10.17 scripts and models; internet is required. Camera frames remain in the browser. Video recording is not included.

## Behaviour

Hold and drag on the rehearsal stage, or start the webcam and overlap your index fingertip with the face. This estimates overlap, not physical touch. Six face regions control growth, not automatic title selection.

Titles are centred across the composition. Title size reaches twice the new fit; growth control reaches 3. Lettering stays opaque; Growth opacity affects only attached growths. Reflections supply metallic highlights. Growth freezes when tracing stops.

Changing slides resets title growth but preserves existing strokes and colours. Default stroke colours are fixed per slide. Width and depth affect new strokes. Face-local strokes follow translation, scale and roll; overlays hide when the face is lost. Large head turns require testing.

The latest 192 stroke segments are retained to bound memory. Long strokes split at 512 points. Drawing persists across slide changes only within the current browser session: refreshing or closing clears it.

## Controls

- Left/right: previous/next slide, resetting title growth only.
- C / Clear strokes: erase strokes only.
- R / Reset all: clear strokes and current title growth, keeping the selected slide.
- Space: pause/resume the three-minute automatic slide timer.
- H: hide/show controls, guides and hint.
- F: fullscreen; press H separately to hide controls.
- Open hand for 0.35 seconds, then close for 0.35 seconds: next slide.

Click the stage before keyboard shortcuts if a control has focus. Slides loop from six to one. Changing camera/rehearsal mode resets title growth but preserves strokes.

## Titles

1. ALTERED IMAGES / VOL. VII
2. CINEWAVE / Selected Moving Image
3. AUTOJEKTOR
4. JOSÉ MACABRA
5. ARVIN DOLA & IRENE GAUMÉ / O Ghost
6. IMMERSIVE BEATS / Parry Videotapes

Edit state.mjs to change titles. Original prototypes remain in originals/.

## Checks

With Node.js installed: `node --test state.test.mjs jets.test.mjs strokes.test.mjs face-space.test.mjs`.

Checks cover state, finite maximum-growth geometry, frozen growth, resize preservation, face mapping and stroke colour isolation. App/material syntax checks also pass. Camera and projector appearance still need live rehearsal.

No actual makeup detection, fluid simulation, recording, or dual-camera coordination is included. Growths are procedural attached surfaces.
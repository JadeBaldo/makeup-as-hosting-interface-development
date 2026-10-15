# Smooth performance preview

Open http://127.0.0.1:8772/performance-smooth/ using the existing server. The original remains at /performance-metal/.

Recording composites are paced at 30 fps and skipped when idle. Still captures force an immediate composite. Recording initialization also forces a fresh frame.

Sheet lettering caches its fixed vertex-to-sheet lookup and reuses the sheet's per-frame inflation values instead of recalculating the local reaction for each text vertex. Geometry resolution, materials, deformation equations and recording resolution are unchanged.

Both versions include bottom-centered white italic subtitles, also drawn into AR images/video. Webcam-only video remains camera-only. A successful capture exports the current slide before advancing and clearing through the existing slide-navigation path. Failed captures before the reset keep the current scene.

Validation used isolated JavaScript execution with mocked canvas, recorder and geometry objects. It does not establish browser FPS, actual encoder behavior, visual appearance, or webcam tracking responsiveness. A headless browser profiling request was rejected; no measured performance improvement is claimed.

Rehearse in Chrome on the performance computer with webcam and recording enabled. Compare frame pacing, readability, capture files, gesture navigation and slide reset with the original version before choosing the preview for the show.

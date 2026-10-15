> Historical notes: superseded by the [15 October checkpoint](../README.md), [decisions](../DECISIONS.md) and [validation status](../VALIDATION.md).

# Gesture capture

Start webcam automatically starts recording after tracking loads. For rehearsal, click Start recording. Show an open hand toward the camera for about a quarter second, then close into a fist within two seconds. Keep it closed briefly. Reopen to arm another capture. Losing tracking cancels an armed gesture. Capture now provides a manual alternative.

The former held-palm slide navigation is disabled in this app to prevent changing and clearing the scene before capture. Use the arrow keys or Previous/Next buttons.

Each gesture saves one timestamped ZIP containing a PNG of the mirrored camera with the current scene and strokes, OBJ geometry with current vertex deformation and world placement, MTL base materials, the completed video segment, and JSON with the current programme, slide, score time, viewport, and timestamps. Recording restarts immediately after the previous recorder is stopped, before export packaging. A successful capture resets strokes and deformation on the same slide. The composite excludes controls and the brush cursor. Video has no audio, matching webcam acquisition.

Files go to browser downloads. Allow downloads for this localhost site. Save last capture again retries the most recent ZIP retained in memory. Closing or reloading the app discards unsaved recording and that retry copy. Long recordings consume memory; capture periodically.

OBJ preserves geometry, not custom shader effects, reflections, or screen-space face cutouts. The PNG and video preserve the rendered appearance. The gesture checks whether the hand is broadside to the camera, but cannot reliably distinguish palm from the back of the hand. Live webcam rehearsal and sensitivity calibration are still required.

Verification: run `python verify-capture-browser.py` from the workspace root with the local server on port 8772. It checks gesture sequencing/rearming, tracking loss and timeout, transformed deformed vertices, hidden mesh filtering, actual MediaRecorder stop/restart, PNG/video/OBJ archive contents and ZIP CRCs, and performance-app startup. Results are written to `.runtime/capture-verification.json`.

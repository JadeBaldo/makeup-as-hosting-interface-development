# Altered Images — Deformation Study 01

This is an independent study folder. Keep it alongside your performance project;
do not copy its files over the performance files.

Open this folder in VS Code and launch index.html through Live Server.
Alternatively run python serve.py (Python 3 required).

Draw directly on the letter with a mouse, stylus or touchscreen. Hold or retrace
to strengthen a continuous swelling trail. The front, bevel, walls and outline
now share deformation: outer contours expand and inner contours narrow.
Rupture compresses the swollen area, leaves residual distortion, and emits
falling pieces. Release to freeze attached deformation; detached pieces keep
falling. Clear & restart restores the original letter and removes loose pieces.

Trail width controls the material-space radius. View angle rotates the letter;
drawing raycasts the deformed geometry rather than the original front plane.
The letter also turns gently and continuously around its own centre, independently
of drawing. View angle sets the base yaw; attached swelling still freezes on lift.
Colour pairing keeps unpainted text saturated and growth brighter than the
stroke. There is no whole-letter colour blend. No webcam is needed.

Test: start at angle 0 and width 6. Draw beside an outside edge for 2–3 seconds;
repeat beside an opening. Retrace and hold for approximately 5–10 seconds to
rupture. Release while pieces fall. Rotate to -40 and +40 degrees and draw on
the visible body. Reset and check the original shape and colour return.

The mesh topology stays fixed. Openings cannot actually merge, surfaces may
self-intersect under extreme swelling, and there is no collision/fluid solver.
The path is anchored to rest coordinates, so brush width stretches with the
material. Dense CPU-updated geometry may reduce frame rate on slower devices.
Automated geometry and picking checks passed; no rendered visual inspection
has been performed for this update.

Optional test, with Node.js: node surface-study.test.mjs

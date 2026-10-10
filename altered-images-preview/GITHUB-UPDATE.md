# Altered Images 01.4 — metallic lettering and accumulated 3D strokes

The performance preview now uses larger centred titles with opaque metallic
lettering and soft glossy growths. Growth opacity is independent of the title,
with broader size and growth controls and studio reflections for visible shine.

Slide changes reset text growth while retaining coloured 3D strokes from earlier
slides. Each slide has a fixed stroke colour; existing strokes retain theirs.
Clear strokes and Reset all are separate controls, with C and R shortcuts.

A Windows launcher and current run instructions are included. Original
prototypes remain preserved. Makeup detection is deferred; webcam interaction
still uses fingertip overlap, with mouse tracing for rehearsal.

Validation: four automated suites pass, covering cue state, geometry, face
mapping and stroke colour persistence. Maximum growth geometry and app/material
syntax checks pass. Camera and projector appearance need live rehearsal.

Recordings and cross-session drawing persistence are not included. To bound
memory, the latest 192 stroke segments are retained.

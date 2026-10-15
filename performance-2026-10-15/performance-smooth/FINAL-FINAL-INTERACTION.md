# Final Final Interaction

Frozen interaction baseline: 11 October 2026, for the 17 October performance.
The integrated project is the working source. The saved 01.5 archive is a later graphics reference, not the build baseline.

## Agreed behavior and reasoning

| Decision | Behavior | Reason |
| --- | --- | --- |
| Drawing pose | Index finger extended, other fingers folded; fingertip must overlap the tracked face. Ambiguous poses pause drawing. | Avoid interpreting pointing as a fist or painting from uncertain tracking. |
| Navigation | Left/right arrows and existing buttons/dropdown; a stable open palm advances only when the entire hand is away from the padded face area. No fist navigation. | Keep navigation distinct from drawing and retain a reliable keyboard fallback. |
| Palm timing | Hold 0.7 seconds, with a progress indicator; trigger once, then require a clear release for 0.15 seconds. Unknown/ambiguous tracking does not re-arm. | Avoid rapid cycling, brief accidental poses and tracking flicker. |
| Face map | One continuous normalized face-local map onto the full current title; no sections, grid or face numbers. Screen overlap with letters is unnecessary. | Remove boundary jumps and the need to move the face toward text. |
| Face attachment | Smooth face position, scale and roll, with subtle estimated yaw/pitch; bound the title within the composition. Marks and input share the smoothed face-local frame. | Keep input, painted face and title registered without applying the root transform twice. |
| Active deformation | Active fingertip overlap builds local deformation. Holding/retracing builds it too; lifting freezes attached deformation. Existing strokes do not replay into new titles. | Preserve deliberate control and separate accumulated face history from each title's state. |
| Marks between slides | Marks accumulate, retaining each stroke's colour. Existing/new strokes share the Stroke opacity setting. | Treat the painted face as the persistent history of the performance. |
| Lettering between slides | Every gesture/manual slide change creates fresh title geometry and removes previous deformation and falling fragments. | Give each title a fresh visual progression without erasing the face history. |
| Clear strokes | Erase face marks only; keep current lettering deformation. | Allow independent control of the two layers. |
| Reset all | Erase marks, current title deformation and fragments; stay on the selected slide. | Provide an explicit full reset without unexpected navigation. |
| Letter rotation | Each glyph turns 360 degrees around its own local Y axis every 360 seconds, with small fixed phase offsets. The shared elapsed-page-time clock continues on lift and through slide changes. | Keep continuous, individually phased motion independent of slide selection. |
| Timing | No automatic slide timer. Separately, the deformation rate is calibrated toward roughly six minutes of sustained drawing at the strongest point. | Let the performer choose slide timing while keeping buildup slow. |
| Opacity | Camera and lettering/growth remain fully opaque; face stroke opacity is adjustable. | Keep the controls focused while allowing marks to recede visually. |

## Titles and session

Keep the six existing title texts and their order. Refresh may clear the session.
Stroke retention is bounded to the latest 192 segments; long strokes split at 512 points, so accumulation is not unlimited.
Camera/rehearsal mode changes reset the lettering and pose latch, retaining marks.
There is no makeup-colour detection, recording or 3D export.

## Architecture

- `app.mjs`: MediaPipe camera/hand/face wiring, continuous frame loop, UI and drawing calls.
- `hand-pose.mjs`: testable landmark classification and whole-hand distance from face.
- `state.mjs`: unchanged title content/order, continuous control coordinates and palm debounce.
- `interaction.mjs`: navigation priority and shared manual/gesture reset behavior.
- `face-space.mjs`, `face-motion.mjs`: shared face frame, smoothing and bounded title root transform.
- `strokes.mjs`: face marks, colour, opacity, accumulation and explicit clearing.
- `letter-motion.mjs`: independent six-minute local-Y rotation.
- `deforming-title.mjs`, `surface-study.mjs`, `deformation-config.mjs`, `material.mjs`: existing slow deformation and lettering graphics.

## Verification and rehearsal limits

Ten automated suites cover classification, palm-away gating, hold/release debounce, keyboard-equivalent actions, face coordinates and transforms, rotation period and continuity, mark persistence/colour/opacity, fresh lettering/fragments, clear/reset separation and slow deformation.
Browser rendering has been checked during development. These checks do not verify live-camera classification or projector appearance.
Rehearse with the actual webcam and lighting: palm clearance, partial occlusion, pointing, release, jitter, yaw/pitch and head movement. The face map remains a frontal approximation with estimated turns, not a calibrated 3D skin mesh.
True local-Y turns are briefly edge-on and show reversed lettering from behind. Fixed glyph topology can self-intersect at extreme deformation; openings cannot actually merge.

## Scope for the next graphics pass

Interaction is the frozen baseline. Work next on shaders, colour, lighting and deformation: stronger local silhouette warping, path-following blisters, rupture and a richer distorted aftermath, using 01.5 for visual qualities only. Do not restore its screen-overlap input. Changes to interaction require an explicit new decision.

A later iteration may export the title, deformation and face marks as separate elements and as a combined 3D scene. Export and makeup tracking remain future work.

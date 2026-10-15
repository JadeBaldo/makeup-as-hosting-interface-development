# Final decisions - 15 October 2026

These decisions summarize the user's accepted requests. Rationale below explains implementation intent; it is not a verbatim quotation.

| Decision | Reason and consequence |
| --- | --- |
| Preserve central 3D titles, raised sheet text, reflective purple/metal layers and face-following strokes. | Keep the established visual composition and material progression. Fixed topology and shader reveals approximate rupture; this is not fluid simulation. |
| Clear marks and deformation on slide changes. | Every programme item begins with a fresh material surface. Previous-slide state survives in the exported capture. |
| Couple successful capture to next-slide navigation. | One open-hand-to-fist sequence captures the current work and continues the programme. Export reads current vertices and metadata before advancing. Opening alone only arms the gesture. |
| Keep recording across captures. | Stop both outgoing segments and immediately restart recorders before packaging the ZIP, preserving continuity of operation. This does not guarantee frame-perfect gapless encoding. |
| Export both rendered and geometric forms plus webcam-only video. | PNG/AR video retain appearance; OBJ preserves current geometry for later use; camera-only output retains the performer independently. |
| Expose global growth from 0 to 6 minutes. | Performance length is adjustable instead of fixed at six minutes; zero is immediate global buildup, not an off switch. Hold/return durations and the local 24-second cycle remain distinct. |
| Duplicate all 3D language as bottom white italic text. | Readability must survive deformation. Include both the entire title and subtitle, including titles with explicit line breaks. |
| Make readable text smaller by default with its own 6-36 size control. | Small-screen/projector composition needs a narrower scale than the 3D title control. Fit to one or two lines without dropping text; automatic fitting may go below the selected size. |
| Include bottom text in PNG/AR video, exclude it from webcam-only video. | The exported performance retains legible programme language while the clean camera recording stays independent. |
| Retain editable programme and calibrated brush proxy. | Make rehearsal changes practical without changing code. Storage is browser/origin-specific; brush input estimates grip rather than detecting an object or painted makeup. |
| Freeze the standard version and keep smoothing as a separate preview. | Protect a recoverable baseline while testing reduced repeated work. No frame-rate claim or automatic quality reduction is introduced. |
| Reuse per-frame sheet inflation and cache lettering lookup indices in the smooth preview. | Text vertices no longer recompute the same local reaction and grid mapping. Geometry density, material equations and resolution stay the same. |
| Pace smooth-preview compositing at 30 fps and skip it while idle. | Match the recording stream rate instead of compositing at every display refresh. Still capture forces a fresh composite; initialization also refreshes the canvas. |

## Deliberately pending

Live camera sensitivity, subtitle appearance on the projector, frame pacing with recording, downloaded footage playback, a complete score run and machine-specific tuning remain rehearsal tasks. Do not describe the smooth preview as verified faster. Keep future optimization commits separate from this checkpoint.

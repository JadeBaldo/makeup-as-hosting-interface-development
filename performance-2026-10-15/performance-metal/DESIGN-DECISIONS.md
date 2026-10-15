> Historical notes: superseded by the [15 October checkpoint](../README.md), [decisions](../DECISIONS.md) and [validation status](../VALIDATION.md).

# Design decisions ? 14 October 2026

This is a working visual checkpoint, before makeup-detection work. Decisions below come from the design conversation. Rationales are editorial interpretations, not verbatim statements by the artist.

| Decision | Rationale (inferred unless quoted) |
| --- | --- |
| Clear face strokes on every slide. | Each programme title should have its own visual identity and a fresh drawing surface. |
| Keep the original central programme titles and face-attached strokes. | Preserve the live performer and programme readability while the material system develops around them. |
| Use an opaque surrounding sheet with a face-following clear opening. | Make material texture readable without losing the face or its makeup gesture. |
| Expand the sheet towards the screen edges with a margin; expose a numeric size control. | The artist revised the earlier A3 panel towards an immersive framing surface, with adjustable scale for different displays. |
| Follow face position and head rotation in 3D. | The surface should feel connected to the performer rather than like a detached screen overlay. |
| Emboss title/subtitle copies at the top and bottom. | Programme language becomes part of the material surface, raised as relief. |
| Make stroke-shaped blisters distinct and reduce competing background ripples. | The physical consequence of the drawing should remain visible after the hand lifts. |
| Run local stroke cycles alongside six-minute global growth. | Gesture-scale events and performance-scale escalation should coexist. |
| Start each local cycle in subtly purple metal; reveal silver, then purple slime; replate and repeat. | Layer changes should read as consequences of swelling and rupture rather than disconnected visual presets. |
| Use 24 seconds for the expanded three-blister sequence. | This was an implementation judgement accepted within the artist's invitation to choose a slightly longer cycle: allow time to read each reveal; duration is not a rendering-cost optimisation. |
| End in purple slime without metal chunks; reveal the next title on purple metal. | Preserve a continuous material bridge between slides instead of returning to the old title or making a visible hard cut. |

## Current behaviour

The six-minute buildup starts on an accepted mark (or timeline inspection). Full slime coverage occurs at 6:00, with a 12-second hold. At 6:12, the next slide is built beneath the sea and strokes clear. A 60-second return reveals the next composition; the 432-second score continues. Manual palm/buttons/arrows/dropdown navigation still changes slides immediately. The numeric sheet size control remains available.

## What this checkpoint does and does not validate

Reaction-state tests passed in headless Chrome for the three blisters, silver/slime phases, flow, resealing and repetition before the latest large-sheet changes. Latest source wiring checks passed for relief text, 3D follow, slide handoff, slime shading and face cutout. The final headless rendered check stalled and was stopped; do not treat that as a visual pass. Existing verification reports in the source directory are historical and may describe earlier behaviour.

Sheet rupture is a shader/material reveal on a deformed fixed-topology mesh, not an actual tear. Letter layers use masks and inset surfaces, not fluid simulation. The larger scene, face camera behaviour, a complete wall-clock score and performance-machine GPU cost still need rehearsal. Browser centimetre margins are approximate CSS dimensions.

## Next work

1. Establish what makeup detection means: applying makeup with a finger/brush, recognising already-painted makeup, or improving fingertip tracking.
2. Improve and verify that input without compromising drawing, release and navigation behaviour.
3. Design export and audience viewing: decide whether the output is a recorded performance, a replay of captured gestures, a live viewing page, or an interactive audience version. No export/viewing delivery format has been selected yet.

# Reference observations and Blender motion proposal

These are local video observations, not an inverse physical simulation. Contact sheets and screen-motion CSVs are reproducible with `python analyse.py`. Optical flow includes highlights and camera motion; it cannot identify viscosity or recover hidden geometry.

## What the clips actually show

- **Jelly Inside, Desktop recording ending 204932:** a glossy blue volume yields asymmetrically. Rounded lower lobes lag the main mass; highlights slide over broad smooth curvature. The 4.2-second recording is too short to establish reliable damping or an exact repeating period. It contains no visible rupture.
- **Softness comparison, recording ending 180540:** the on-screen labels move through 0%, 25%, 50%, 75% and 100% softness. The last 100% segment rapidly loses height and spreads against the floor, with broad folds and little rebound. Those different settings are separate examples, not successive states of one material. Use the 100% segment for the collapse only, not to shorten the buildup.
- **Bubble typography:** close-ups show strongly shaped reflections and smaller inflated cells varying in size over a legible glyph. The recording cuts between f, I, O and W. Cuts are not ruptures. Surface variation is useful; copying uniform bubble particles would undermine the shared letter surface.
- **Recording ending 183601:** an earlier R browser study, useful as a comparison of its overly rigid silhouette; it is not the softness simulation.

## Chosen translation into Python

Use one connected rounded R mesh and matching inner-gel geometry. Three overlapping path-local pressure shapes change the actual silhouette. Two lightly damped spring channels provide broad delayed sway, with different phases for horizontal and vertical motion. These are smooth shape offsets rather than jitter or independent sphere blisters.

At rupture, a narrow dark seam and two membrane lips recoil locally. A short attached liquid thread releases two glossy heavy drops. Then the membrane loses volume rapidly, acquires smaller residual folds, falls to the floor and settles with a restrained damped response. The underlying R stays connected, retaining its opening. The seam is a visible tear cue, not an actual topology cut; true cut topology remains a possible later improvement.

The new Blender motion study uses an **18-second accelerated inspection timeline**, with rupture at 10.5 seconds. It is a visual proposal, not the real six-minute performance. The browser's 360-second pressure buildup is unchanged. A later implementation would drive these shape weights from the existing shared trace field and its pressure clock, rather than replaying this fixed animation.

## Parameters worth judging

### Revised aftermath following Jade's feedback

The deflated/carcass finish was rejected in favour of boiling dissolution. `chemical-study.py` preserves that earlier test and builds a new alternative: reflective liquid-metal covering, viscous slime as its inner source, local rupture, an attached draining thread, accumulating liquid residue and restrained rising vapour. Following Jade's further clarification, the interior is inexhaustible: it never empties or disappears. The covering partially dissolves to expose it; procedural drivers keep draining and emitting with a fixed amount of geometry. Procedural holes expand monotonically; animated local bulges and surface ripples suggest boiling. No carcass fall or wrinkled collapse is used in this alternative.

This chemical behaviour is an art-directed interpretation of Jade's new description, not a behaviour recovered from the reference clips. The reference observations still guide delayed motion, liquid reflections and surface variety. The inner R stays present beneath the remaining covering. Continuous emission deliberately violates mass conservation; a finite fluid reservoir would contradict the concept.

Pressure widths and offsets; sway frequency (3.7 radians/second), stiffness (32/26), damping (5/4.6); collapse duration (1.05 seconds); fall/settle duration; residual fold depth; seam width; liquid amount. These are art-directed starting values, not measurements extracted from the clips.

The remaining visual judgement is whether the skin feels sufficiently thin and yielding, whether the visible tear reads as rupture, and whether the residue has enough weight. There is no claim that the reference's exact simulation has been recovered.

# Blender authoring prototype for Study 03

## Playable reference-driven motion proposal

Open `review.html` for the rendered clip and stage images, or visit `http://localhost:8772/blender/review.html` while the existing Study 03 server runs. The clip is 384px at 12 FPS for inexpensive motion inspection; stage images are 640px Cycles renders. `encode-preview.py` uses Blender's bundled H264 encoder, adding no dependency. `browser-review-check.mjs` checks loading, play/pause, seeking and restart through the existing Chrome debugging session.

**Latest direction:** `output/altered-r-chemical-study.blend`. Open this file and press Space over the 3D view. This supersedes the deflation proposal for visual review, while preserving it as a comparison. The liquid-metal blue covering develops small uneven bubbles, ruptures and partially dissolves to expose turquoise slime. The slime is deliberately **inexhaustible**: it never empties or dissolves. It drains continuously through a viscous thread, with recurring drops, into an accumulating pool. Restrained rising procedural vapour suggests a chemical reaction. There is no falling carcass in this alternative.

`chemical-study.py` builds that alternative from the preserved motion study. `verify-chemical.py` checks monotonic partial dissolution, matching geometry, open counter, absence of deflation/fall, inexhaustible liquid release and restarting. Procedural drivers keep the thread, recurring drops, rising vapour and growing pool active beyond the 18-second keyed excerpt; the Blender timeline is 60 seconds. Tests also sample much later frames. Only two drop objects and a fixed thread mesh are reused; fluid accumulation changes one pool mesh's scale, avoiding unbounded particle storage. `render-motion.py --chemical` renders the first 18 seconds. The earlier `boiling-study.py` is recoverable as a simpler intermediate proposal.

The effect uses keyed geometry, shader holes and procedural emission, not physical evaporation, smoke or fluid solvers. Mass is intentionally not conserved: this is an impossible replenishing source. The inner R and some metal covering remain identifiable. The accelerated buildup is for inspection; none of these Blender scripts changes browser behaviour or its 360-second buildup. Restarting the preview timeline starts a fresh demonstration.

Open `output/altered-r-motion-study.blend`, keep the pointer over the 3D view and press **Space** to play/pause. **Shift + Left Arrow** returns to the first frame. The timeline markers identify pressure, rupture/liquid release, fall and settled residue. Scrub near frame 253 to inspect rupture.

This is a separate 18-second accelerated inspection animation. The browser's six-minute buildup and interaction remain unchanged. The original `altered-r.blend` and browser checkpoint remain recoverable.

`animate-study.py` adds three local pressure shapes, coupled delayed sway, residual folds, a registered rupture seam/lips, a brief liquid thread and two heavy drops. It saves only the new motion file. `reference-analysis/BEHAVIOURS.md` distinguishes observed reference behaviour from chosen parameters and limitations. `analyse.py` generates contact sheets and screen-motion measurements; those do not recover a physical simulation.

Rebuild with Blender's executable and `--background --python animate-study.py -- --render`. Run `verify-motion.py` with Blender for geometry, opening, lifecycle, liquid release and restart checks. `render-motion.py` makes a lower-resolution complete preview without changing the saved project. The seam is a visual opening cue, not a topology cut; true fluid dynamics are not simulated.

Blender 5.2.2 installed at `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`.

Double-click `RUN-BLENDER-STUDY.bat` to rebuild the source scene, export and previews. The script starts a new empty scene in a background Blender process; it does not open or replace an existing user scene. Outputs are deliberately regenerated in this folder's `output/`.

`build-study.py` reads the bundled-font R in `source/letter-r.json`, voxel-remeshes and relaxes its closed surface, smooths its reflection topology, then authors matching Basis (filled), Stretched and Collapsed shape keys. The outer membrane and inset luminous core are separate mesh elements. The authoring file includes studio area lights, a floor, camera, Cycles materials and three rendered views.

Outputs:

- `output/altered-r.blend`: editable source scene; shape keys on `Altered_R_Membrane` and `Altered_R_Luminous_Core`.
- `output/altered-r-shapes.glb`: both meshes with Stretched and Collapsed morph targets; no studio lights or baked animation.
- `output/filled.png`, `stretched.png`, `collapsed.png`: offline Cycles previews.
- `output/build-report.json`: Blender version, vertex/face count, topology check and limitations.

`prepare-source.mjs` regenerates the input using Study 03's existing bundled Three.js/font; run with Node 22.15+ from this folder. This keeps the same letter identity and font, with rounder source bevels. `python verify-export.py` validates GLB structure, finite coordinates and matching nonzero morph targets.

This is an art-directed shape study, not a soft-body/fluid simulation. The collapsed key preserves its opening but cannot model tearing or topology changes. The browser still uses the existing shared-field deformation: these Blender assets have not been integrated or substituted into it. The next step is visual approval of the shapes, then local mask-driven blending with the existing drawing field. Global morph blending alone would not preserve local drawing behaviour.

Cycles lighting and render quality do not automatically transfer to Three.js; the browser will need its own equivalent material/reflection setup. The exported asset contains two medium-resolution meshes and two morph targets each; inspect file size and performance before integration. Render previews establish an offline target, not verified browser quality.

The pre-Blender browser deformation is separately archived at the workspace root in `saved-versions/altered-images-study-03-shared-surface-graphics-pass-2026-10-11.zip`, with a SHA256 file.

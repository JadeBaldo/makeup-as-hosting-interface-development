# Validation status

## Checks completed during this session

- Before the final interaction/subtitle changes, headless Chrome verified growth timing at 6, 3, 0.1 and 0 minutes, including the progress control. This is not a browser pass of the final snapshot.
- Isolated JavaScript checks with mocked canvas/recorder objects checked both versions: app syntax; outgoing slide metadata and geometry before navigation; advance/clear once; recording state resumes; six ZIP input entries; subtitles in AR only; new-slide subtitle synchronization; open/fist rearming without held-fist repetition.
- Isolated sheet checks compared standard versus optimized position/slime/purple arrays across 70 animated drawing/melt frames and reset, rebuild, resize and face transforms, using mocked geometry with 16,000 text vertices. Arrays matched exactly. This does not validate real Three.js normals, GPU rendering or visual equivalence.
- Mock timing checks confirmed smooth-preview recording initialization, no idle composites and approximately 30 composites per second under 60 Hz frame calls.
- After the final two-line subtitle change, syntax checks passed for app/capture/layout modules in both copies. Layout checks exercised 140/400/1200-pixel widths, sizes 6/22/36, programme examples, long titles and a 200-character unbroken string, checking at most two lines and no text loss with mocked font metrics.
- The local server returned HTTP 200 for the smooth preview. Snapshot integrity is recorded in SOURCE-SHA256.json.

The checks above are session evidence, not a committed comprehensive automated test suite. Existing *.test.mjs and verification/ reports are inherited and may assert historical behavior. They were not rerun as a complete final regression suite. The earlier capture browser report predates the latest interaction and subtitle updates.

## Still required before the show

1. Start the selected frozen version on the actual computer, browser, camera and projector with internet available for tracker loading.
2. Confirm final programme text, readable one/two-line subtitles, chosen duration and framing. Programme localStorage is not embedded in the repository.
3. Record while drawing, then open/fist capture. Confirm exactly one slide advance, fresh deformation, correct outgoing text/geometry and continuous recording operation.
4. Open the downloaded ZIP: inspect PNG/OBJ, play both videos and verify outgoing slide metadata. Check subtitles are present only in AR output.
5. Rehearse a complete selected-duration score, including hold, automatic handoff and return. Compare standard versus smooth preview under the same workload.
6. Measure frame pacing before further optimization. Browser CPU profiling was requested but approval was rejected; no measured FPS improvement, real webcam responsiveness, final visual pass or gapless video guarantee is claimed.

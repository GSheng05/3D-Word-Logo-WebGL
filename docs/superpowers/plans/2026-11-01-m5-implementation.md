# M5 Logo Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Execution method proposed here is inline implementation; no delegation is required.

**Goal:** Build Chun Shang's M5 controls, colour engine and recording workflow for the CPC354 WebGL word-logo assignment.

**Architecture:** Preserve the existing plain JavaScript script-based architecture. M5 owns UI state, validation feedback, colours and recording orchestration; a small adapter translates M5 operations to teammate functions. Develop against explicit mock capabilities and progressively substitute actual modules.

**Tech Stack:** HTML, CSS, browser JavaScript, existing WebGL/MV.js modules, MediaRecorder where supported. No frontend framework or build tool is needed.

**Spec:** `../specs/2026-11-01-m5-requirements.md`, distilled from `CPC354_M5_Conversation_Archive(1).md`.

## Global Constraints

- 2–4 ASCII letters; keep the last valid logo on invalid input.
- Preserve playback phase during valid word/depth changes and live speed changes.
- Four colour modes: Single, Front/Side, Per-Letter, Gradient; retain independent mode settings in memory for the current session.
- Use `faceIds`, `letterIds`, `bounds`; request `letterBounds` without renaming existing fields. Face 0 is front; 1–5 use back/side colour.
- Gradient: 2–4 evenly spaced colours, 0–360 degree direction, whole-word/per-letter and all-surfaces/front-only choices.
- Keep separate shininess/specular values for Matte, Glossy and Metallic; Restore Defaults affects only the selected material.
- Manual light-direction or gradient-angle adjustment displays Custom; selecting a preset synchronizes sliders.
- Recording supports 1280×720 or 1920×1080, automatic full intro plus 3–15 real seconds of hover, and manual start/stop. Lock settings during both modes; Stop Recording remains accessible.
- Do not implement M1 geometry generation, M2 shaders/shadows, M3 fitting or M4 animation algorithms inside M5.
- Record meaningful AI assistance, review, changes and verification for assessment disclosure.

## Repository evidence, checked 1 November 2026

The git root is `D:/PROJECT/CPC354 Assignment 1`. Application paths below are relative to that root and begin `CPC354-Assignment-1/`.

- Local HEAD: `30b57b6` (Skeletal structure setup); clean before this document. Application files locally are all empty.
- Remote `main` has newer code. These observations came from remote file reads and directory listings; the local checkout was not pulled or modified to match it.
- Remote M1 `src/geometry/word.js`: `validateWord(input)` and `buildWordGeometry(options = {})`. Options include `word`, `blockSize`, `letterSpacing`, `extrusionDepth`; default word is USM, depth 1. Positions/normals are flat Float32Array; indices Uint16Array; faceIds/letterIds Uint8Array. Bounds contain 3-element min/max/size/center arrays. `letterBounds` is absent.
- Current validator trims outer whitespace, rejects internal spaces and non-ASCII letters, enforces 2–4 characters, then uppercases. This differs from the archived claim that whitespace is merged. Use current validation consistently; flag this discrepancy for M1 before changing it.
- Remote M4 exposes `startAnimation()`, `stopAnimation()`, `resetAnimation()`, `setAnimationSpeed(sliderValue)`, `getAnimationState()`, `isAnimationRunning()`, `setRenderCallback(fn)`, `setPhaseChangeCallback(fn)` and `getAnimationModelMatrix()`.
- `stopAnimation()` pauses and preserves elapsed time. `setAnimationSpeed(60)` means 1×. Current callbacks are single slots, not multiple-listener events.
- Remote `animationControls.js` already wires buttons, speed, Space/R and +/- keys. Expected IDs: startBtn, stopBtn, resetBtn, speedSlider, speedValue, phaseLabel. Do not initialize its handlers and M5 duplicate handlers together.
- Remote `phases.js` has seven phases, including an extra Scale down before Hover, and fixed MAX_SCALE=2.5. The archived brief does not require scale-down. M4 must reconcile this with the original PDF; automatic export must detect the actual intro boundary rather than assume 10 or 12 seconds.
- Remote camera defines `getViewMatrix()` and depends on MV.js. UI files and renderer files are zero-byte placeholders. Dynamic fitting/resizing, projection and rendering APIs remain unverified; do not treat the conceptual TV object as an existing API.

## File map

| File | Responsibility |
|---|---|
| `CPC354-Assignment-1/index.html` | Studio markup, canvas, accessible controls and ordered script loading |
| `CPC354-Assignment-1/styles/style.css` | Right sidebar, accordions, responsive preview, focus and recording states |
| `CPC354-Assignment-1/src/ui/state.js` (new) | Session state, defaults and mode/material memory |
| `CPC354-Assignment-1/src/ui/adapter.js` (new) | Real-module translations, capability checks and mock substitutions |
| `CPC354-Assignment-1/src/ui/controls.js` | Render controls from state; conditional sections and labels |
| `CPC354-Assignment-1/src/ui/events.js` | One event/shortcut owner, validation transaction and recording lock |
| `CPC354-Assignment-1/src/ui/colors.js` | Pure per-vertex colour computation; preserve plural repository filename |
| `CPC354-Assignment-1/src/ui/export.js` (new) | Capture lifecycle and recovery |
| `CPC354-Assignment-1/src/ui/mocks.js` (new) | Explicit development-only module substitutes and fixtures |
| `CPC354-Assignment-1/src/main.js` | Minimal shared composition changes with M3; one render/animation loop |
| `CPC354-Assignment-1/tests/m5.test.cjs` (new) | State, validation, gradient and adapter contract tests using Node built-ins if available |
| `docs/m5-browser-checks.md` (new) | Integrated visual, resize, keyboard and recording checks |

Do not add backdrop customization merely because backdrop.js exists; it was not an agreed feature. Keep optional validation/toast helpers inside controls/events initially; split only if those files become hard to maintain.

## Proposed M5 interfaces

These are new internal contracts, not teammate-approved function names. Expose them under `window.M5` to avoid collisions with global helper names such as M4's lerp().

- `M5.createState(config) -> State`: config supplies confirmed ranges/material defaults; missing advanced capabilities remain disabled.
- `M5.makeColors(geometry, colorState) -> Float32Array`: packed normalized RGBA, four components per geometry vertex. RGBA is an M5 internal choice; adapter converts to RGB only if M2 confirms that format.
- `M5.createAdapter(bindings) -> Adapter`: `buildGeometry(options)`, `replaceGeometry(mesh, rgba)`, `updateColors(rgba)`, `requestRender()`, `play()`, `pause()`, `reset()`, `setSpeed(multiplier)`, `getPlayback()`, `setProjection(mode)`, `resizePreview()`, `setLight(value)`, `setMaterial(value)`, `setShadow(value)`, `beginCaptureSize(width,height) -> restoreFunction`, `subscribePlayback(listener) -> unsubscribe`.
- `getPlayback() -> {running, elapsedSeconds, phaseName, introComplete}`; derive introComplete through M4's phase metadata only after agreement. One adapter callback fans out notifications; avoid overwriting the render callback.
- `setSpeed(multiplier)` maps to existing `setAnimationSpeed(multiplier * 60)`.
- `M5.initControls(root,state,adapter) -> disposeFunction`; `M5.initEvents(root,state,adapter) -> disposeFunction`.
- `M5.createRecorder({canvas,adapter,onStatus}) -> {startAutomatic(options),startManual(options),stop(),dispose()}`. Start methods return promises for successful startup, not the entire recording duration. Stop is idempotent; status events report completion/error.

Capabilities distinguish renderer, projection, lighting, materials, shadow opacity, shadow softness, capture resize and intro boundary support. An unavailable real capability is disabled with a short explanation; mocks are clearly labelled in the development harness.

## Review Focus

1. Invalid text or failed geometry/upload must retain the previous successful mesh and settings; Task 3.
2. Repeated letters and narrow glyphs must each receive their own correct local gradient; Task 4.
3. Focused controls, IME composition, modifier keys and recording must not trigger global playback shortcuts; Task 2/6.
4. Sidebar and recording resize must preserve framing and recover on every failure; Task 5/6.
5. Missing module APIs, single-slot callbacks and repeated initialization must not duplicate handlers or animation loops; Task 1/2.

## Task 1: Establish a usable integration baseline

- [ ] Fetch remote refs and compare local HEAD to origin/main; fast-forward only after confirming clean application files and intended branch. Do not reset local changes. Record the resulting commit SHA in the implementation notes.
- [ ] Read any new AGENTS.md and existing tests after synchronization; recheck every interface listed above against that snapshot.
- [ ] Add adapter and deterministic mock fixtures using M1's exact typed-array structure. Include two repeated letters with distinct letterIds and different occupied widths.
- [ ] Add a Node built-in contract test: speed 1 maps to raw 60, pause does not reset elapsed time, colour updates never invoke buildGeometry, unavailable advanced APIs report unavailable capabilities.
- [ ] Run `node --test CPC354-Assignment-1/tests/m5.test.cjs`; first demonstrate the new assertions fail, then implement adapter translations until they pass. If Node is absent, establish the runtime before starting this task.
- [ ] Record confirmed M2 ranges/colour format, M3 resize/restore contract and M4 intro boundary. Keep unsupported advanced controls gated while core work continues.
- [ ] Commit the adapter/mock/test deliverable after verification.

## Task 2: Build the Studio shell and playback controls

- [ ] Implement markup/styles and M5 state: right independent accordions, preview, floating Start/Pause/Reset, sidebar reopen button, inline status and toast region.
- [ ] Keep sidebar-hidden and Focus Mode separate state flags. Proposed Focus behaviour: hide header/sidebar, retain playback and exit control, restore previous sidebar preference on exit. Do not use browser fullscreen automatically.
- [ ] Use the existing animation control IDs for compatibility. M5 events is the chosen sole input owner: do not call initAnimationControls() alongside it. Document this handoff with M4.
- [ ] Bind Space/R/F/H once; ignore input/select/textarea/contenteditable, composing events, repeats and Ctrl/Alt/Meta combinations. Preserve native focused-button activation. Block playback mutations during recording.
- [ ] Adapter actions call current M4 playback functions and refresh UI from actual state. Reset animation leaves colours/materials/word settings untouched.
- [ ] Browser-check keyboard navigation, visible focus, independently opened accordions, sidebar hide/reopen and Focus restoration; repeated init/dispose must leave exactly one action per click/key.
- [ ] Verify canvas layout changes notify M3 without restarting playback. Without renderer, verify this in labelled mock harness; do not claim WebGL visual integration passed.
- [ ] Commit the shell/events/state deliverable.

## Task 3: Safe word, depth and speed editing

- [ ] Add regression assertions for `tv -> TV`, valid USM/LOGO, rejected A/ABCDE/A1B/A B/non-ASCII input and failed geometry construction retaining the previous mesh.
- [ ] Maintain draft text separately from renderedWord; call M1 validateWord/buildWordGeometry with an options object. Do not remove internal whitespace silently.
- [ ] On valid word/depth input, construct geometry and colours before upload. Publish new rendered state only after successful replacement; renderer must retain/restore old buffers if upload fails.
- [ ] Coalesce rapid geometry slider updates to the latest pending value per frame. Geometry replacement calls requestRender() even while paused, without resetAnimation().
- [ ] Map displayed speed multiplier to existing raw slider units at adapter boundary. Confirm finite positive limits with M4 instead of assuming 0 is a pause setting.
- [ ] Run Node assertions and browser-check changing TV to LOGO mid-rotation, invalid editing, depth while paused and speed changes without phase jumps.
- [ ] Commit the mandatory live controls deliverable.

## Task 4: Implement the four-mode colour engine

- [ ] Test one RGBA per vertex, finite values in [0,1], face 0 versus 1–5, repeated-letter indexing, exact two-stop endpoints and 3/4-stop interpolation boundaries.
- [ ] Implement Single, Front/Side and Per-Letter in colors.js; preserve four character-position colour slots when switching between shorter/longer valid words.
- [ ] Implement gradient projection in centred logo-local XY coordinates: direction d=(cos(theta),sin(theta)); project occupied-bound corners onto d, normalize each vertex projection to [0,1], clamp and interpolate adjacent evenly spaced colour stops. Proposed 0 degrees runs left to right, 90 bottom to top. A zero projected extent uses midpoint t=0.5.
- [ ] Whole-word uses bounds; per-letter uses letterBounds indexed by letterIds. If letterBounds is unavailable, disable per-letter gradient with an explanation until M1 delivers it; other colour modes continue working.
- [ ] Front-only gradient applies interpolation only to face 0 and the selected solid back/side colour to 1–5. All-surfaces uses the same XY field across every face.
- [ ] Add tests for angles 0/90/180/360, degenerate projected bounds, occupied narrow glyphs and two equal letters in different positions. Exclude non-finite/misaligned arrays with explicit errors.
- [ ] Add presets/manual pickers and 2–4 stop add/remove; retain separate mode settings. Manual angle marks direction Custom; manual palette edit marks palette Custom. These are separate labels.
- [ ] Verify recolouring calls updateColors only and appears while paused. Run Node tests and integrated visual checks before commit.

## Task 5: Connect camera, movement, light, materials and shadows

- [ ] With M3, connect perspective/orthographic selection and preview resize. Dynamic fit must include word/depth/aspect and animated extents. Test narrow/wide preview, hidden sidebar and return from capture size.
- [ ] Connect movement selectors only for modes M4 actually supports; preserve current elapsed phase. Current source has a single hover implementation; float/sway/orbit remain target features pending M4.
- [ ] Populate light presets/ranges from M2 config. Selecting preset sets direction sliders; manual direction sets Custom; intensity changes retain the direction label.
- [ ] Test separate Matte/Glossy/Metallic state: change Glossy, switch Matte, return Glossy; Restore Defaults resets Glossy only. Consume M2 numeric defaults; do not present illustrative percentages as shader values.
- [ ] Connect shadow toggle/opacity only where supported; preserve disabled values. Omit or disable unsupported softness with a clear status.
- [ ] Check actual lit output and moving floor shadow with M2; test near-parallel light directions for renderer stability. Keep unavailable controls disabled and record blockers.
- [ ] Run state regressions and browser checks, then commit integrated graphics controls.

## Task 6: Automatic and manual recording

- [ ] Test recorder state transitions idle -> preparing -> recording -> stopping -> idle/error; concurrent start rejection and repeated stop must be safe. Test restore/unlock after capture-size failure, unsupported MIME, recorder error and early Stop.
- [ ] Capability-check captureStream, MediaRecorder and supported MIME types. Use supported WebM types; report unavailable export rather than promising MP4.
- [ ] beginCaptureSize sets real canvas backing dimensions and M3 viewport/projection; retain a restoration closure. Acquire stream after resize, record/download actual selected dimensions, then stop all tracks and restore on every terminal path.
- [ ] Automatic: lock settings, prepare resolution, reset animation to initial pose, render that pose, start capture, then play. Once confirmed introComplete becomes true, count 3–15 seconds using monotonic wall time independent of speed. Do not hardcode phase numbers or initial sequence length.
- [ ] Manual: preserve current pose and running/paused status at start; record until Stop. Both modes block settings and playback mutation shortcuts; Stop Recording remains enabled.
- [ ] Proposed completion behaviour: restore preview dimensions and original running/paused flag while retaining the last captured pose; exact pre-record timeline restoration is outside the agreed scope. On setup failure before animation changes, preserve original playback untouched.
- [ ] Use one cleanup path, user-visible elapsed status, sensible filename, object URL revocation after download and disposal safeguards. If page becomes hidden during auto recording, stop with a clear interruption message rather than silently deliver a frozen sequence.
- [ ] Browser-check both resolutions by inspecting output metadata, full initial pose/sequence, chosen hover seconds at 0.5×/2×, manual paused capture, early Stop and recovery. Mock recorder tests do not prove real capture quality.
- [ ] Commit recording only after actual-browser capture verification; document device/browser limits.

## Task 7: Integrated acceptance and assessment evidence

- [ ] Run all automated tests once after final integration; check browser console and script order from a local HTTP server.
- [ ] Complete docs/m5-browser-checks.md with expected/observed outcomes for Tasks 2–6, browser/version, recording metadata and remaining capabilities.
- [ ] Verify one animation loop, no duplicate controls, paused live recolour, valid word replacement continuity, restored material/colour memory and recovery after failed recording.
- [ ] With M4, compare actual sequence against original assignment PDF, resolve the extra scale-down phase and test automatic recording against the finalized boundary.
- [ ] Update README with launch instructions, M5 ownership, capability limitations and teammate contracts. Add AI-use notes and a concise UI -> state -> colour buffer -> GPU explanation for report/video/viva.
- [ ] Record final checks and commit the verified deliverable. Do not push, publish or create messages to teammates as part of this planning request.

## Ready-to-start boundary

Tasks 1–4 can proceed using labelled mocks after obtaining current source; real per-letter gradient awaits letterBounds. Task 5 depends on actual graphics capabilities. Task 6 depends on renderer, resize/restore and confirmed intro boundary. This document prepares implementation; it does not claim those dependencies exist or that tests have run.

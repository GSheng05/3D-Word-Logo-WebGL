# CPC354 — 3D Word Logo / Animated TV Ident

> **Start here, including AI agents.** This README is the project's living progress and handoff record.
> Read it before editing, verify it against the current branch, and update it before handing work to the next contributor.
> An implemented module is not automatically integrated, browser-verified, or submission-ready.

## Current checkpoint

- **Status:** M1 geometry implementation is complete at module level; the final application is not integrated.
- **Code baseline reviewed:** [9276284](https://github.com/GSheng05/3D-Word-Logo-WebGL/commit/927628461446ef33c77475b3f1a195203c71071f).
- **Latest handoff:** M1 implementation and review → M2 rendering, with M3 camera coordination.
- **Next concrete milestone:** render the real centred word through the production renderer, using bounds-based camera framing, then connect the existing animation engine.
- This snapshot reflects the baseline above. Check newer commits before treating any status below as current.
- Assignment PDFs and last year's reference ZIP were supplied outside this repository. Obtain the actual assignment/rubric if needed; do not assume they exist at a particular local path.

## Assignment targets

Build the word geometry programmatically using WebGL; do not substitute a pre-built text model.
Use a 3–4-letter word for the main demonstration (the implementation also supports two letters).

Required sequence: centred original pose → right 180° → return → left 180° → return → enlarge to an appropriate full-screen size → looping movement.
Provide varied HTML controls for at least extrusion depth, speed, and logo colour, configurable before playback.
Keep code clear and modular and add meaningful extensions.

| Assessment | Marks | Evidence needed |
| --- | ---: | --- |
| Written report | 50 | Contributions 3; introduction 5; literature review 12; proposed method 12; AI/external-code disclosure 8; conclusion 8; references 2 |
| Program | 30 | Correct animation 10; robust UI 10; code quality/extensions 10 |
| Videos and viva | 20 | Group video 5; individual video 5; viva 10 |

The report requires Arial 11pt, 1.5 line spacing, normal margins, explained diagrams/equations, and critical analysis.
Target at least three cited sources with analysis for the literature review's excellent band.
Group video: maximum 10 minutes. Individual video: maximum 5 minutes per member.
The stated individual viva/Q&A session is 15–20 minutes.
Feature count alone does not establish a high mark; the assignment and rubric remain authoritative.

## Ownership and actual progress

| Owner | Responsibility | Current state | Next handoff/action |
| --- | --- | --- | --- |
| M1 | Font, block/word geometry, validation, spacing, depth, centring, bounds | Implemented and numerically tested; diagnostic demo exists | M2 consumes mesh; M3 consumes bounds; M5 consumes metadata/validation |
| M2 | WebGL context, buffers, shaders, lighting | Production files are empty | Implement renderer and render M1's mesh |
| M3 | Camera, projection, matrices, resizing | Production files are empty | Fit real word dimensions; agree matrix conventions and enlargement target |
| M4 | Animation timing, phases, playback | Three modules and cube test page exist; not integrated with real word | Review sequence issue; connect render callback and model transform |
| M5 | UI, colour palettes, backdrop, events | Production files and stylesheet are empty | Implement controls against agreed APIs; avoid duplicate playback listeners |
| Shared | Application composition, report, videos, submission | index.html and src/main.js empty; no complete submission recorded here | Name an integration coordinator and allocate remaining deliverables |

Common/MV.js and Common/initShaders.js are also empty placeholders.
Do not infer that a dependency works simply because its file exists.
M4's test page includes temporary math fallbacks; those do not fill the production Common files.

## Run what exists

From the repository root:

```sh
cd CPC354-Assignment-1
node --test test/geometry.test.cjs
```

Use a modern Node.js release with the built-in test runner. No npm dependencies are needed for these tests.

Open these files directly in a WebGL-capable browser:

- [Geometry lab](test/geometry-test.html): real word geometry, depth/size/spacing, horizontal rotation, face/letter colours.
- [Animation test](test/animation-test.html): existing cube-based animation harness, not the integrated word application.

Opening index.html currently does not run a finished application. There is no application build command yet.

## What M1 implemented

| File | Contents |
| --- | --- |
| [font.js](src/geometry/font.js) | Fixed-width 5×7 A–Z bitmap definitions |
| [cube.js](src/geometry/cube.js) | Centred extruded block, hard-edge normals, outward triangle winding, face IDs |
| [word.js](src/geometry/word.js) | Word validation, block placement, index offsets, letter assembly, actual-bounds centring |
| [geometry.test.cjs](test/geometry.test.cjs) | Six automated test groups |
| [geometry-preview.js](test/geometry-preview.js) | Test-only WebGL adapter; not M2/M3/M5 production code |
| [M1 guide](docs/M1-geometry.md) | Mathematics, API contract, integration checklist, video outline |

The mesh uses 24 vertex records and 36 indices per block. Corner locations are duplicated across faces so each face has its own normal.
Normals remain unchanged under the translations used to assemble the word.
All faces, including hidden internal faces between adjacent blocks, are currently retained.

## M1 interface: preserve or explicitly coordinate changes

These are the implemented contracts; teammate acceptance has not yet been recorded.

Load classic scripts in this order:

```html
<script src="src/geometry/font.js"></script>
<script src="src/geometry/cube.js"></script>
<script src="src/geometry/word.js"></script>
```

```js
const mesh = buildWordGeometry({
    word: "USM",
    blockSize: 1,
    letterSpacing: 1,
    extrusionDepth: 1
});
```

| Output | Format / meaning |
| --- | --- |
| positions | Float32Array, **3 components per vertex**, object space |
| normals | Float32Array, 3 components per vertex, outward unit normals |
| indices | Uint16Array; use gl.TRIANGLES and gl.UNSIGNED_SHORT |
| faceIds | Uint8Array, one ID per vertex: front +Z=0, back -Z=1, top +Y=2, bottom -Y=3, right +X=4, left -X=5 |
| letterIds | Uint8Array, zero-based character ID per vertex |
| bounds | min, max, size, center; each an [x,y,z] array |
| word / blockCount | Normalized word and number of occupied bitmap cells |
| parameters | Normalized input settings used for generation |

- X points right, Y up, Z towards the front. Actual occupied geometry is centred at the origin on all axes.
- Faces are counterclockwise when viewed from outside.
- Text: trim outer whitespace, normalize ASCII lowercase, accept 2–4 A–Z letters. No digits, punctuation, or internal spaces.
- blockSize and extrusionDepth: finite numbers from 0.01 to 100; letterSpacing: 0 to 100, in world units.
- Spacing means the gap between five-column character boxes, not necessarily the visible strokes.
- Invalid input throws a descriptive error. Build successfully before replacing the old mesh.
- No final colours array or blockIds array is returned. M5 maps faceIds/letterIds to colours; M2 uploads colours.
- Default USM dimensions are **17 × 7 × 1**. Default LOGO dimensions are **23 × 7 × 1**.
- Last year's code used four-component positions and much smaller default blocks. Do not copy its attribute sizes or camera settings unchanged.
- Rebuild geometry for word/size/spacing/depth changes only. Speed and camera changes do not require rebuilding it.
- See the M1 guide for the detailed equations. No external matrix library is required by M1.

## Instructions for the next contributor / AI agent

1. Read this README, the M1 guide, applicable repository instructions, and the files you will change.
2. Inspect the latest branch and local changes. Preserve others' work and distinguish current code from plans.
3. Start with M2's real-mesh renderer and coordinate M3's framing. Do not replace M1 with a new text-generation approach without a documented reason.
4. For M2, use size-3 position attributes and construct vec4(position, 1.0) in the shader as needed. Transform normals consistently with the lighting coordinate space.
5. For M3, derive camera fit from bounds and allow space for rotation/hover. Establish a separate enlargement target; do not auto-fit away the visible enlargement during animation.
6. For M4, load phases.js before animation.js. Existing hooks include setRenderCallback(), getAnimationModelMatrix(), startAnimation(), stopAnimation(), and resetAnimation(). Inspect actual source before integration.
7. Agree who composes the model matrix: M4 currently does it. Do not apply M3 and M4 transforms twice. Keep a single animation-frame loop.
8. For M5, inspect animationControls.js before binding playback/speed events. Existing IDs include startBtn, stopBtn, resetBtn, speedSlider, speedValue, and phaseLabel. Bind controls once.
9. Verify that edits while paused redraw correctly, invalid input preserves the previous mesh, resize works, and colour updates need not rebuild positions.
10. Run relevant checks, record actual results, and update this README using the protocol below before handing off.

Suggested main.js flow: initialize renderer/controls → build mesh → upload buffers → calculate camera → register animation render callback → render initial pose.
The render callback combines projection/view with the agreed model transform and draws the uploaded mesh.

## Verification and known gaps

### Verified at the M1 checkpoint

- Six Node test groups pass: font shape, block geometry, all glyph meshes, parameter independence, normalization/determinism, invalid/boundary input.
- Checks include index range, outward triangle winding, unit normals, centring, and counts.
- Syntax and whitespace checks passed during implementation.
- The tests were rerun successfully during the comparison review.

### Not verified / not complete

- Browser visual verification: no browser executable was available, and attempted browser downloads failed. Do not label the demo visually verified on the strength of numerical tests.
- Final renderer, camera, UI, and application integration are not complete.
- Automated tests do not yet directly check every occupied/empty cell's spatial placement or all metadata associations.
- Diagnostic lighting is object-space lighting. It is not completed production lighting.
- The diagnostic view auto-fits geometry and offers only horizontal rotation. Auto-fitting can mask apparent size changes.
- Report-ready figures, full formal report, student-specific critique, videos, and viva preparation are outstanding.

### Specification issue to resolve with M4

The current phases include scale up → scale down → hover, with MAX_SCALE = 2.5.
The instructions specify enlargement followed by looping movement. Safest default: retain the enlarged pose for the loop.
Also replace the assumption that a fixed scale is "full-screen" with a target appropriate to word bounds and viewport.
This issue was identified, not fixed, in M1's work.

## Improvement backlog — recommendations, not completed features

| Priority | Task | Owner |
| --- | --- | --- |
| High | Integrate real mesh with renderer and bounds-based framing | M2 + M3 + coordinator |
| High | Real-browser checks, including edits while paused and resizing | Relevant owners |
| High | Review animation sequence and enlargement target | M4 + M3 |
| Medium | Auto-fit toggle, Fit view button, vertical rotation/view presets in diagnostic lab | M1 |
| Medium | Exact cell-placement and metadata association tests | M1 |
| Medium | Explicit blockIds if M5 needs per-block palettes | M1 + M5 |
| Later | Remove hidden shared faces; update count expectations and verify exterior | M1 |
| Optional | Digits, block gutters, extra visual styles | Coordinate scope first |

For the current font and default spacing, removing shared faces within letters would reduce USM from 576 to 428 triangles and LOGO from 720 to 532.
These are calculated counts, not measured performance gains. Optimisation is not a prerequisite for integration.

## Report and authorship handoff

M1's technical notes are not the final report. Convert them into explained figures and prose with actual verification evidence.
Each member must explain their code and its connections to the rest of the application.

Keep report evidence accurate; do not invent personal student work, tests, screenshots, citations, or teammate approval.

## Mandatory README update protocol for every handoff

Before finishing a work session that changes code, interfaces, verification status, or project progress:

- Update **Current checkpoint** and the ownership table to reflect what actually exists.
- Update API details whenever an interface changes; identify affected members and migration steps.
- Move backlog items to completed only with implementation and relevant verification evidence.
- Record exact test commands, outcomes, browser/platform if tested, and limitations.
- Record new blockers, remaining defects, and the next concrete action with an owner.
- Append a handoff log entry below. Preserve earlier entries.
- Commit the README alongside related changes when appropriate. Push according to the user's authorization and repository workflow; never claim a push succeeded until verified.

This is a contributor workflow instruction, not an automatic GitHub process: a future agent must actually read and follow it.

Copy this template for the next handoff:

```markdown
### Handoff: <member/agent> → <next owner>
- Code baseline / commit(s):
- Completed changes and files:
- Interface decisions or changes:
- Verification commands and actual results:
- Browser checks / unverified behaviour:
- Remaining blockers and known issues:
- Next owner and first concrete task:
- Report updates:
- Repository delivery status: <local only / committed / pushed and verified>
```

## Handoff log

### Handoff: M1 implementation → M2 / M3
- Code commit: 9276284 (pushed to main and verified).
- Completed: A–Z bitmap geometry, extruded blocks, word assembly, validation, centring, bounds, metadata, numerical tests, diagnostic demo, technical notes.
- Verification: six Node test groups passed; syntax/whitespace checks passed. Browser visual testing blocked by unavailable browser/download failures.
- Interface: three-component positions, Uint16 indices, centred object space, face/letter metadata; teammate acceptance pending.
- Next: M2 renders the actual mesh; M3 frames its bounds; coordinate M4 and M5 integration.
- Outstanding: production integration, visual verification, report figures, student critique, videos.

### Handoff: README consolidation → next contributor
- Reviewed code baseline: 9276284; production placeholders remain empty.
- Completed: consolidated status, ownership, mesh contract, risks, prioritised backlog, and ongoing README update protocol.
- Validation: checked current GitHub file inventory and relative links against repository paths.
- No implementation improvements from the review are represented as completed.
- Next owner: M2, in coordination with M3; first task is a production render of the default USM mesh.

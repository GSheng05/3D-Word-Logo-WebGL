# M5 requirements baseline

Source: reviewed `CPC354_M5_Conversation_Archive(1).md`, a reconstructed record of thirty decisions and teammate feedback. Exact assessment wording remains governed by the original assignment PDF. This baseline records decisions already made; proposed engineering choices are labelled in the implementation plan.

## Selected approach and ownership

The user selected progressive development using mock interfaces followed by integration. Fully independent UI development risks incompatible contracts; integrating directly with unfinished teammate modules would block core UI work. Hybrid development is the selected approach, not a new decision requiring another interview.

M5 owns settings, DOM events, validation feedback, colour generation and recording orchestration. M1 owns geometry, M2 rendering/materials/lighting/shadows, M3 camera/projection/resize/main composition, M4 animation/timing. Keep plain browser JavaScript and existing file organization. No replacement rendering or animation engines in M5.

## UI and live editing

- Editor/Studio with collapsible right sidebar and independent accordion categories: Logo, Colour, Camera, Lighting/Material, Animation, Export.
- Floating playback Start/Pause/Resume/Reset beneath preview remains accessible in Focus Mode.
- Space toggles playback, R resets animation, F toggles Focus Mode, H toggles sidebar. Do not hijack focused form editing.
- Changes appear live during animation; valid word replacement preserves animation phase.
- 2–4 alphabetic characters; invalid drafts show inline feedback and preserve the previous valid logo. M1 handles uppercase normalization. Repository discrepancy about internal spaces is documented in the plan.
- Inline errors plus occasional status toasts; no toast on every slider movement.
- Required extrusion depth, speed and colours precede advanced features.

## Colours and materials

- Single, Front/Side, Per-Letter and Gradient; presets and manual pickers; independent session memory for each mode.
- faceIds=0 front; faceIds=1–5 back and sides. letterIds are zero-based character positions. Use bounds and requested letterBounds in final centred local coordinates, each with min/max/size/center.
- Gradient: 2–4 evenly spaced colours; presets plus custom 0–360 degree angle; whole-word or repeated per-letter; all surfaces or front-only with solid back/sides.
- Direction preset selection synchronizes sliders; manual direction adjustment sets Custom for gradient and lighting.
- Directional-light presets and azimuth/elevation/intensity sliders. M2 confirms conventions and ranges.
- Matte, Glossy, Metallic each retain their shininess/specular adjustments. Restore Defaults affects only the selected material. Metallic is a Phong visual approximation.
- Cast shadow on a flat floor, tied to light and animation; toggle and opacity intended; softness optional after M2 feasibility. Unsupported functionality must not appear as working.

## Camera, animation and recording

- Perspective/orthographic live control; M3 handles dynamic fit and resize on word/layout/export changes.
- Movement style selection depends on M4 delivery; playback/speed updates preserve timing.
- Automatic full required sequence plus 3–15 real seconds of final hover; manual start/stop; 720p/1080p presets at actual output dimensions.
- Lock customization during both recording modes; recording indicator/elapsed status and Stop remain accessible. Restore controls and viewport after stop/error.
- Target canvas-only video via browser capture; compatibility and high-resolution performance require actual testing.

## Success and constraints

Core UI works independently against labelled mocks and integrates through confirmed real contracts. Recolouring updates a separate colour buffer without geometry regeneration. UI actions do not reset ongoing playback accidentally. No fake softness controls, assumed shader ranges or claimed video dimensions without verification. Across-refresh persistence, arbitrary gradient-stop positions, extra environment customization and a new framework are outside this baseline.

## Delivery order

1. Current-source contracts and mocks.
2. Studio shell, playback and mandatory live controls.
3. Four-mode colour engine.
4. Camera, movement, light/material/shadow integrations as delivered.
5. Recording and failure recovery.
6. Integrated acceptance, documentation and AI-use evidence.

Open team contracts are implementation dependencies, not a reason to repeat the completed user interview: letterBounds; colour-buffer layout; light/material/shadow schemas; dynamic fit/recording restoration; animation intro boundary and sequence reconciliation.

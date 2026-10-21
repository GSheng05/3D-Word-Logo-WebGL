# Team Guide – CPC354 Assignment 1 (3D Word Logo)

This guide is for every member of the team.
You do not need to know git or WebGL before you start.
Read sections 1 to 5 once. Then read **your own** section in part 6.

Contents

1. [Quick start](#1-quick-start)
2. [Who owns which file](#2-who-owns-which-file)
3. [Git workflow, one step at a time](#3-git-workflow-one-step-at-a-time)
4. [Adding a new file](#4-adding-a-new-file)
5. [Interface contract](#5-interface-contract)
6. [Your part (one section per member)](#6-your-part)
7. [AI log and failure log](#7-ai-log-and-failure-log)
8. [Academic rules](#8-academic-rules)
9. [Week-4 demo script](#9-week-4-demo-script)

---

## 1. Quick start

1. Open the folder `CPC354-Assignment-1/`.
2. Double-click `index.html`. It opens in your web browser.
   No server and no install are needed.
3. You should see four yellow boxes (one per letter of LOGO) in the middle of a dark page,
   and a control panel on the right.

**What the yellow badge means.**
At the bottom of the control panel there is a yellow box (the *badge*).
It lists every *placeholder* that is still in use.
A placeholder is a temporary, very simple version of a function.
It lets the page run before the real code exists.
Example:

```
Placeholders in use: M1 buildLogo · M2 initRenderer, uploadGeometry, drawScene · ...
```

When you write the real version of your function, its name disappears from the badge.
When every part is real, the badge turns green and says **"All parts are real code"**.

**If the page is blank:** press `F12` to open the browser's developer tools.
Click the **Console** tab. Red lines are errors. The first red line is usually the cause.

---

## 2. Who owns which file

Only the owner edits a file. If you need a change in someone else's file, ask them.

| Member | Area | Files you own |
|---|---|---|
| M1 Jason | 3D geometry | `src/geometry/font.js`, `extrude.js`, `word.js` |
| M2 Phing Hong | Rendering & lighting | `src/rendering/webgl.js`, `buffers.js`, `shaders.js`, `lighting.js`; the shader `<script>` tags in `index.html` |
| M3 Yong Zhou | Camera & matrices, start-up | `src/graphics/transforms.js`, `camera.js`, `projection.js`, `resize.js`; `src/main.js` |
| M4 Jeffry | Animation engine | `src/animation/phases.js`, `animation.js`, `animationControls.js`; `test/animation-test.html` |
| M5 Chun Shang | Interaction & colour | `src/ui/controls.js`, `events.js`, `colors.js` (and later `export.js`) |

Shared files:

| File | Rule |
|---|---|
| `index.html` | Everyone. Change only the lines inside **your own** comment block. |
| `styles/style.css` | Everyone. Add rules; do not delete other people's rules. |
| `Common/MV.js`, `Common/initShaders.js` | Nobody. This is Angel's library. See `Common/SOURCE.md`. |
| `src/dev/placeholders.js` | Nobody. It switches itself off. See section 5. |
| `docs/logs/<your-name>-*.md` | Each member owns their own log files. |

### Names in the planning doc vs. names in the repo

Our planning doc (the "From Claude" tab) uses some different file names.
The repo names win. Use this table to translate.

| Name in the planning doc | Actual file in the repo |
|---|---|
| `src/math/*` | `src/graphics/*` |
| `playback.js` | `src/animation/animation.js` + `src/animation/animationControls.js` |
| `extrude.js` | `src/geometry/extrude.js` (renamed from `cube.js`) |
| `color.js` | `src/ui/colors.js` |
| `export.js` | does not exist yet; M5 creates `src/ui/export.js` later |
| `backdrop.js` | removed (we are not doing backdrops) |
| shared `TV` object | not used; we use plain global functions |

---

## 3. Git workflow, one step at a time

**Git** is a tool that records every version of the files.
**GitHub** is the website that keeps the shared copy.
A **branch** is your own private line of work. Changes on your branch do not touch anyone else.
`main` is the shared branch. It must always work.

Type every command in a terminal (on Windows: *Git Bash*), inside the project folder.

### Step 0 · One-time setup (only once per computer)

```bash
git clone https://github.com/GSheng05/3D-Word-Logo-WebGL.git
cd 3D-Word-Logo-WebGL
git config --global pull.rebase false
```

You should see: a new folder `3D-Word-Logo-WebGL`.
The last line has no output. It tells git how to combine branches when you pull,
so later `git pull` commands do not stop with "Need to specify how to reconcile divergent branches".

---

### Step 1 · Get the latest `main`

```bash
git switch main
git pull origin main
```

You should see: `Already up to date.` or a list of changed files.

---

### Step 2 · Create your branch

Use your own branch name:

| Member | Branch |
|---|---|
| M1 | `feature/m1-geometry` |
| M2 | `feature/m2-rendering` |
| M3 | `feature/m3-camera` |
| M4 | `feature/m4-animation` |
| M5 | `feature/m5-ui` |

```bash
git switch -c feature/m1-geometry
```

You should see: `Switched to a new branch 'feature/m1-geometry'`.

If the branch already exists (second time), drop the `-c`:
`git switch feature/m1-geometry`.

---

### Step 3 · Edit only your files

Write your code. Then check what you changed:

```bash
git status
```

You should see: only **your** files under "Changes not staged for commit".
If you see someone else's file there, undo it: `git restore <that file>`.

---

### Step 4 · Test

Double-click `index.html` (or press `F5` if it is already open).
Check three things:

1. The page still shows the logo.
2. The Console (`F12`) has no red errors.
3. Your function's name is **gone** from the yellow badge.

---

### Step 5 · Stage your files

"Stage" means: choose which changes go into the next save point.
Name your files one by one. **Never use `git add .`** — it can add files that are not yours.

```bash
git add src/geometry/font.js src/geometry/word.js
git status
```

You should see: your files in green under "Changes to be committed".

---

### Step 6 · Commit

A *commit* is a save point with a message.
Message format: `M<number>: <what you did>`.

```bash
git commit -m "M1: add stroke data for L, O, G"
```

You should see: `[feature/m1-geometry 1a2b3c4] M1: add stroke data for L, O, G` and `2 files changed`.

Make small commits. One idea per commit is best.

---

### Step 7 · Push your branch to GitHub

```bash
git push -u origin feature/m1-geometry
```

You should see: some lines ending with a link like
`https://github.com/GSheng05/3D-Word-Logo-WebGL/pull/new/feature/m1-geometry`.
After the first time, plain `git push` is enough.

---

### Step 8 · Open a Pull Request

A **Pull Request** (PR) asks the team: "please check my branch, then put it into `main`".

1. Open the link from Step 7 (or GitHub → **Pull requests** → **New pull request**).
2. **base:** `main` · **compare:** your branch.
3. Title: same style as a commit, e.g. `M1: letters L, O, G with extrusion`.
4. Description: what you did, how you tested it, and any new file you added.
5. On the right, under **Reviewers**, pick your viva partner (table in section 6).
6. Click **Create pull request**.

You should see: a page with your commits and a green or grey "Merge" box.

---

### Step 9 · Your viva partner reviews

Your partner opens the PR, reads the code, opens `index.html` on your branch, and then either:

- writes comments (you fix them, commit, push again — the PR updates by itself), or
- clicks **Review changes → Approve**.

---

### Step 10 · Merge and delete the branch

After approval, the PR **author** clicks **Merge pull request → Confirm merge**,
then **Delete branch**.

Then, on your computer:

```bash
git switch main
git pull origin main
git branch -d feature/m1-geometry
```

You should see: `Deleted branch feature/m1-geometry`.
For your next task, start again at Step 1.

---

### Keeping your branch up to date with `main`

Other members merge their work into `main` while you work.
Bring their work into your branch like this:

```bash
git switch feature/m1-geometry
git pull --no-edit origin main
```

You should see: `Already up to date.` or `Merge made by the 'ort' strategy.`
Do this before you open a PR, and whenever someone tells you `main` changed.

### What a merge conflict looks like

A *conflict* happens when you and someone else changed the same lines.
Git stops and says `CONFLICT (content): Merge conflict in index.html`.
Open that file. You will see:

```
<<<<<<< HEAD
<script src="src/geometry/letters.js"></script>
=======
<script src="src/ui/export.js"></script>
>>>>>>> origin/main
```

- The part above `=======` is yours.
- The part below `=======` is from `main`.

Basic fix:

1. Edit the text so it is correct. Often you keep **both** lines.
2. Delete the three marker lines (`<<<<<<<`, `=======`, `>>>>>>>`).
3. Save, then:

```bash
git add index.html
git commit --no-edit
```

If you are unsure, stop and undo the whole merge with `git merge --abort`. Then ask in the group.

### Two "never" rules

1. **Never commit straight to `main`.** Always work on your branch and use a PR.
2. **Never `git push --force`.** It can delete other people's work on GitHub.

---

## 4. Adding a new file

1. Put the file in **your own** folder (for example `src/geometry/letters.js`).
2. Open `index.html`. Find your comment block, for example `<!-- M1 Jason: 3D geometry -->`.
3. Add one line inside that block:

   ```html
   <script src="src/geometry/letters.js"></script>
   ```

   Order matters only for code that **runs** while the file loads.
   Function definitions can be in any order inside your block.
4. Write plain global functions (`function myThing() { ... }`).
   Do **not** use `import`, `export` or `type="module"`.
   Module scripts are blocked when the page is opened by double-click.
5. Mention the new file in your PR description.

---

## 5. Interface contract

The *contract* is the list of functions that one member's code calls in another member's code.
If everyone keeps these names and shapes, the parts fit together.
`src/main.js` calls them in this order:

```
start-up:        initRenderer → resizeCanvas → initUIControls → initAnimationControls → rebuild
on any change:   readSettings → sanitizeWord → buildLogo → makeColors → uploadGeometry → draw
every frame:     getAnimationModelMatrix, getViewMatrix, getProjectionMatrix → drawScene
```

```
// M1 — geometry (src/geometry/*)
buildLogo(word, depth) -> {
    positions:   Float32Array,  // x,y,z per vertex; triangles; no index buffer (use gl.drawArrays)
    normals:     Float32Array,  // x,y,z per vertex
    faceType:    Uint8Array,    // per vertex: 0 = front, 1 = back, 2 = side
    letterIndex: Uint8Array,    // per vertex: 0,1,2,3 = which letter it belongs to
    vertexCount: number,
    bounds: { minX, maxX, minY, maxY, minZ, maxZ }   // logo is centred on the origin
}

// M5 — interaction & colour (src/ui/*)
readSettings() -> { word, depth, speed, colorMode, colorFront, colorSide }   // colours as "#rrggbb"
sanitizeWord(text) -> string        // uppercase letters only, 3–4 long; anything else falls back to "LOGO"; never throws
makeColors(geometry, settings) -> Float32Array   // r,g,b,a per vertex, 0..1
initUIControls(onSettingsChange, onResize)       // wires word/depth/colour inputs and the window "resize" event

// M3 — camera & matrices (src/graphics/*)
resizeCanvas(canvas, gl) -> aspect  // match canvas size to its display size, set gl.viewport
getViewMatrix() -> mat4
getProjectionMatrix(aspect, mode) -> mat4   // mode: "perspective" (default) or "orthographic"
getFitScale(bounds, aspect) -> number       // S = 0.9 * visibleWidth / logoWidth

// M2 — rendering (src/rendering/*)
initRenderer(canvas) -> gl
uploadGeometry(geometry, colors)
drawScene(modelMatrix, viewMatrix, projectionMatrix)

// M4 — animation (already exists in Jeffry's files; do not change)
initAnimationControls(), setRenderCallback(fn), getAnimationModelMatrix(),
startAnimation(), stopAnimation(), resetAnimation(), isAnimationRunning()
```

### Units and conventions, one sentence per function

Coordinates: **x** points right, **y** points up, **z** points towards the viewer.
Lengths are in *world units* (the numbers in `positions`; they have no real-world size).
Every `mat4` is an MV.js matrix (stored row by row); upload it with `flatten()`, never transpose by hand.

| Function | Units and conventions |
|---|---|
| `buildLogo` | `word` is already clean (3–4 capital letters); `depth` is in world units (0.1–1.5); the front face is at `z = +depth/2`, the back face at `z = −depth/2`, and the whole logo is centred on (0, 0, 0). |
| `readSettings` | `word` is the raw text from the box (not cleaned yet); `depth` is a number; `speed` is the slider value (60 = normal speed); colours are strings like `"#ffcc33"`. |
| `sanitizeWord` | A pure function: same input, same output; it never changes the page and never throws. |
| `makeColors` | Returns `vertexCount × 4` numbers in the same vertex order as `positions`; each value is 0..1; alpha is 1. |
| `initUIControls` | Calls `onSettingsChange()` and `onResize()` with **no** arguments; `main.js` then reads the settings itself. |
| `resizeCanvas` | Sets `canvas.width/height` in real screen pixels (CSS size × `devicePixelRatio`) and returns width ÷ height. |
| `getViewMatrix` | Moves the world so the camera sits at the origin looking down −z (world → camera space). |
| `getProjectionMatrix` | Turns camera space into clip space; `aspect` is width ÷ height from `resizeCanvas`. |
| `getFitScale` | Returns a plain number (no unit): the scale at which the enlarged logo fills 90 % of the screen width. |
| `initRenderer` | Returns the WebGL 1 context; turns on the depth test and sets the clear colour. |
| `uploadGeometry` | May be called many times (every settings change); each call replaces the old data on the GPU. |
| `drawScene` | Clears the screen and draws `vertexCount` vertices as triangles with the three matrices. |
| M4 functions | Times are in seconds; angles in degrees; `getAnimationModelMatrix()` returns `T · Ry · Rx · S`. |

### How the placeholders step aside

`src/dev/placeholders.js` loads **after** everyone's files.
For each function it checks:

```js
if (typeof buildLogo !== "function") { /* add a temporary buildLogo */ }
```

So when you define `function buildLogo(word, depth) { ... }` in your own file,
the check is false and the placeholder is skipped. **You never edit `placeholders.js`.**

One exception: M2's three functions (`initRenderer`, `uploadGeometry`, `drawScene`)
share one shader program. Their placeholders switch off **together**,
as soon as any one of the three is real. So M2 must add all three in the same PR.
If only one or two exist, the Console shows a red message saying so.

---

## 6. Your part

### Viva partners

Each member reviews the PRs of the next member, and studies their code for the viva.

| Reviewer | Reviews the PRs of |
|---|---|
| M1 Jason | M2 Phing Hong |
| M2 Phing Hong | M3 Yong Zhou |
| M3 Yong Zhou | M4 Jeffry |
| M4 Jeffry | M5 Chun Shang |
| M5 Chun Shang | M1 Jason |

The report section names below are our working titles. Check them against the brief's report format.

---

### M1 Jason — 3D Geometry

**Must build (required by the brief)**
- Our own **stroke-based letters**: each letter is a set of straight strokes,
  and each stroke is a 4-corner shape.
  Curves (the O and the G in LOGO; also S, C and others for the extension)
  are made of 8–12 short straight segments.
- **Extrusion**: turn each flat 4-corner shape into a solid block of depth `d`
  (front face, back face, and side walls).
- **Normals**: front `(0, 0, 1)`, back `(0, 0, −1)`,
  side walls perpendicular to their edge, pointing outward.
  Every face has its own vertices (vertices are not shared between faces).
- **Centring**: the whole logo is centred on the origin in x, y and z.
  Jeffry's model matrix rotates and scales about the origin,
  so an off-centre logo would swing around instead of turning in place.

**Extension:** type any word A–Z (3–4 letters).

**Your files**
- `font.js` — the stroke data for each letter (corner points in 2D).
- `extrude.js` — one 4-corner shape + depth → triangles, normals, face types.
- `word.js` — `buildLogo(word, depth)`: place letters side by side, centre them, fill the arrays.

**Your first small step**
In `word.js`, write a first `buildLogo` that draws **every** letter as the letter **I**:
one tall rectangle stroke, extruded to depth `d`.
Reload the page. The four placeholder boxes become four thin bars,
and `buildLogo` disappears from the badge.

**How to test**
- Badge: `buildLogo` is gone.
- Drag **Depth**: the letters get thicker and thinner.
- Press **Start**: during the turns, you see side walls and the back. No holes.
- Console: `buildLogo("LOGO", 0.5).bounds` → `minX` equals `−maxX`, `minY` equals `−maxY`, `minZ` equals `−maxZ`.

**Done when**
- [ ] L, O and G look right from the front and while rotating (both O's identical).
- [ ] No gaps between strokes, and no missing walls.
- [ ] Normals point outward (lighting looks right once M2's lighting is in).
- [ ] `bounds` is symmetric about 0 on all three axes.
- [ ] `vertexCount === positions.length / 3`, and all five arrays have matching lengths.
- [ ] Any 3–4 letter word works (extension).

**Viva questions you must be able to answer**
1. How do you build a curved letter like S from straight pieces? How many pieces, and why?
2. Why must the logo be centred on the origin? What happens if it is not?
3. How do you compute the normal of a side wall from its edge?
4. Why does every face need its own vertices, instead of sharing corners?

**Report section:** 3D Geometry and Modelling.

---

### M2 Phing Hong — Rendering & Lighting

**Must build**
- WebGL setup (get the context, viewport, clear colour).
- Shaders: put the two `<script>` tags in `index.html` where the comment says,
  and load them with `initShaders(gl, "vertex-shader", "fragment-shader")`.
- Buffers for positions, normals and colours.
- Depth test, and drawing with `gl.drawArrays(gl.TRIANGLES, …)`.
- Lighting: **ambient** (a constant base light) + **diffuse** (brighter when a face points at the light).

**Extension:** Phong lighting (adds a shiny highlight) and material presets (matte / glossy / metal).

**Your files**
- `webgl.js` — `initRenderer(canvas)` and `drawScene(...)`.
- `shaders.js` — compile the shaders and find attribute and uniform locations.
- `buffers.js` — `uploadGeometry(geometry, colors)`.
- `lighting.js` — light position and material values sent as uniforms.

**Important:** add `initRenderer`, `uploadGeometry` and `drawScene` **in the same PR**.
They switch off their placeholders together (see section 5).

**Your first small step**
Write the three functions with the simplest shader: position and colour only, no light.
Reload. The boxes look flat (every side the same brightness),
and the three M2 names disappear from the badge.

**How to test**
- Badge: no M2 names. Console: no red errors and no WebGL warnings.
- Press **Start**: when the logo turns, the back never shows through the front (depth test).
- Change the colours in the panel: the logo follows.
- Resize the window: the logo is not stretched.

**Done when**
- [ ] Shaders are in `index.html` and loaded with `initShaders`.
- [ ] Ambient + diffuse lighting; side walls are darker or lighter than the front as they turn.
- [ ] Matrices are uploaded with `flatten()`; nothing is transposed by hand.
- [ ] Calling `uploadGeometry` many times (dragging Depth) does not slow the page down.
- [ ] Phong + material presets (extension).

**Viva questions you must be able to answer**
1. What does the depth test do? What goes wrong without it?
2. Why do we multiply the normal by the model matrix, and why with `w = 0`?
3. What is the difference between ambient, diffuse and specular light?
4. What does `flatten()` do, and why must we not transpose the matrix again?

**Report section:** Rendering and Lighting.

---

### M3 Yong Zhou — Camera & Matrices (+ `main.js`)

**Must build**
- **Projection**: `getProjectionMatrix(aspect, mode)` with `perspective(...)`.
- **Camera**: `getViewMatrix()` with `lookAt(eye, at, up)`.
- **Full-screen fit**: `getFitScale(bounds, aspect)` — the enlarge step must fill the screen.
- **Resize maths**: `resizeCanvas(canvas, gl)` — no stretching at any window size.

**Extension:** perspective ↔ orthographic toggle.
For a smooth switch, make the orthographic box the same size as the perspective view at `z = 0`:
half-height = camera distance × tan(fovy / 2).

**Your files**
- `camera.js` — `getViewMatrix`.
- `projection.js` — `getProjectionMatrix`.
- `resize.js` — `resizeCanvas`, `getFitScale`.
- `transforms.js` — small helpers you need (for example, the visible width at a given distance).
- `src/main.js` — start-up and glue (already written; you must be able to explain every line).

**A known problem for you to solve: the fit-scale formula**
The contract says `S = 0.9 * visibleWidth / logoWidth`.
If `visibleWidth` is measured at `z = 0`, the enlarged logo is **too big**:

- After scaling, the front face is at `z = S × depth/2`, not at `z = 0`.
- The front face is closer to the camera, so it looks bigger.
- Example (calculated, not measured): camera at `z = 4`, fovy 45°, window 1280 × 633,
  the four placeholder boxes of LOGO (3.8 units wide).
  The `z = 0` formula gives S ≈ 1.59 at any depth.
  With depth 0.5, the front face then covers about **100 %** of the width, not 90 %.
  With depth 1.5, it covers about **128 %**, so both ends are cut off.

The placeholder already avoids this. It measures the visible width at the front face:

```
visible width at distance D  =  2 · D · tan(fovy/2) · aspect
front face distance          =  cameraZ − S · maxZ
solve  S · logoWidth = 0.9 · 2 · (cameraZ − S · maxZ) · tan(fovy/2) · aspect   for S
```

It also does the same for the height, and takes the smaller S.
Write your own version, and be ready to explain it.

**Your first small step**
In `camera.js`, write `getViewMatrix()` with `lookAt(vec3(0, 0, 4), vec3(0, 0, 0), vec3(0, 1, 0))`.
Reload. `getViewMatrix` disappears from the badge.
Then change the eye to `vec3(0, 0, 6)`: the logo gets smaller. Change it back.

**How to test**
- Badge: no M3 names.
- Drag the window corner: the logo stays centred and never stretches.
- Console: `currentFitScale` changes when you resize the window or change the depth.
- After Jeffry's TODO (b): at the end of "Scale up", the logo fills about 90 % of the width, for a wide **and** a narrow window.

**Done when**
- [ ] All four M3 functions are real.
- [ ] No stretching at any window size; sharp on high-DPI screens.
- [ ] The enlarged logo fills ~90 % of the width and never goes off-screen, at any depth.
- [ ] Orthographic toggle works (extension).

**Viva questions you must be able to answer**
1. What do the three arguments of `lookAt` mean?
2. What do `fovy`, `aspect`, `near` and `far` do? Why can `near` not be 0?
3. Why do we set `canvas.width` from `clientWidth × devicePixelRatio`? What happens if we do not?
4. Derive your fit scale. Why measure at the front face and not at `z = 0`?

**Report section:** Viewing, Projection and Screen Fit; plus the program structure (`main.js`).

---

### M4 Jeffry — Animation Engine

**Must build** (most of this is already done in your files)
- All 7 steps of the brief:

  | Phase | Brief step | From → To |
  |---|---|---|
  | 0 | Start centred | angle 0°, scale 1 |
  | 1 | Rotate right | 0° → +180° about Y |
  | 2 | Back | +180° → 0° |
  | 3 | Rotate left | 0° → −180° |
  | 4 | Back | −180° → 0° |
  | 5 | Enlarge | scale 1 → S (full-screen fit from M3) |
  | 6 | Move about (loops forever) | hover with sine terms, **stays at scale S** |

- Easing, a seamless hover loop, speed, Start / Stop / Reset, and the **Space / R / + / −** keys.

**Extension:** a choice of hover styles.

**Your files:** `phases.js`, `animation.js`, `animationControls.js`, `test/animation-test.html`.

**Your two TODOs**

(a) **Remove the "Scale down" phase.**
There is no scale-down step in our design. The hover follows the enlarge directly.
- `phases.js` line 32: delete the `{ name: "Scale down", duration: 2.0 },` entry.
- `phases.js` line 95: delete `case 5` (`tf.scale = lerp(MAX_SCALE, 1, p);`),
  and renumber the hover case.
- In the hover case, set `tf.scale` to the fit scale.
  This is needed because `initialTransform()` resets `scale` to 1 for every frame.
  Without it, the logo jumps back to normal size when the hover starts.

(b) **Use the real full-screen scale.**
`phases.js` line 14 `var MAX_SCALE = 2.5;` is a fixed number.
It is too big for a narrow window and too small for a wide one.
Use `currentFitScale` instead. It is a global variable set in `main.js`
(from M3's `getFitScale`), and it is recomputed when the window or the depth changes.
Use it in the enlarge case and in the hover case.

**Also noticed during testing (your call how to fix it)**
After pressing **Start**, the phase label says "Ready" for the first 2 seconds.
Reason: the Start button calls `updateAnimationUI()` while `elapsed` is still 0.
After that, the label is only refreshed when the phase *changes*
(`setPhaseChangeCallback(updateAnimationUI)`), and phase 0 ends at 2 s.

**Your first small step**
Do TODO (a). Reload and press **Start**.
After about 10 s the label goes straight from "Scale up" to "Hover", and the phase count shows `/6`.

**How to test**
- `test/animation-test.html` still works (it now uses the real `MV.js`).
- In `index.html`: the full sequence, Stop then Start resumes from the same point, R resets, + / − change speed.
- During the hover, the logo stays big and moves smoothly, without a jump at the start.

**Done when**
- [ ] The phases match the table above. No scale-down.
- [ ] Enlarge uses `currentFitScale`; the hover keeps that scale.
- [ ] Hover loops forever with no visible jump.
- [ ] Hover style choice (extension).

**Viva questions you must be able to answer**
1. Why is the speed applied to each frame's time step and not to the total time?
2. What does the ease-in-out curve do, and why does the logo look smoother with it?
3. Why does the hover start without a jump, and why does it loop forever?
4. Why is the model matrix `T · Ry · Rx · S` in that order? What if you swap T and S?

**Report section:** Animation.

---

### M5 Chun Shang — Interaction & Colour

**Must build**
- Control panel inputs: word, depth, speed, colour. (The HTML is already in `index.html`. Keep the ids.)
- **Safe word input**: `sanitizeWord` — capital letters only, 3–4 long, otherwise `"LOGO"`. It never throws.
- The window **resize** event (it calls `onResize`).
- **Colour modes**: `single` (one colour), `frontSide` (front vs. side), `perLetter` (one colour per letter, using `letterIndex`).

**Extension:** export the ident as a video (`.webm`), in a new file `src/ui/export.js`.

**Keyboard keys are not yours.** Space / R / + / − are Jeffry's.
They already work in `animationControls.js`. Do **not** add them again.
The speed slider is also already connected by Jeffry; `readSettings` only reports its value.

**Your files**
- `controls.js` — `readSettings()`, `sanitizeWord(text)`.
- `events.js` — `initUIControls(onSettingsChange, onResize)`; also update the `depthValue` label.
- `colors.js` — `makeColors(geometry, settings)`.

**Your first small step**
Write `sanitizeWord` in `controls.js`. Reload, then type in the Console:

```js
sanitizeWord("logo")  // "LOGO"
sanitizeWord("A B")   // "LOGO"  (only 2 letters)
sanitizeWord("12")    // "LOGO"
```

`sanitizeWord` disappears from the badge.

**How to test**
- Badge: no M5 names.
- Type `A B`, `12`, or empty the word box: no crash, the logo shows `LOGO`.
- Each colour mode changes the logo as expected.
- Resize the window: the logo stays centred.

**Done when**
- [ ] All four M5 functions are real.
- [ ] Bad input never crashes. (Nice to have: a short message that says the word fell back to LOGO.)
- [ ] All three colour modes work; `perLetter` uses `letterIndex`.
- [ ] `.webm` export works (extension).

**Viva questions you must be able to answer**
1. Why must user input be cleaned before it reaches `buildLogo`?
2. What is the difference between the `input` and `change` events?
3. How does `perLetter` mode use `letterIndex`?
4. How do `canvas.captureStream()` and `MediaRecorder` make a `.webm` file?

**Report section:** User Interaction and Colour.

---

## 7. AI log and failure log

The assignment asks us to record how we used AI and what went wrong.

1. Copy the two templates in `docs/logs/`:
   - `TEMPLATE-ai-log.md` → `docs/logs/<your-name>-ai-log.md`
   - `TEMPLATE-failure-log.md` → `docs/logs/<your-name>-failure-log.md`
2. Add an entry **on the same day** it happens. Do not try to remember it later.

**AI log entry:** prompt → what the AI gave → what was wrong → what you changed → how you tested it.

**Failure log entry:** what broke → why → how it was fixed.

Example: `docs/logs/yongzhou-ai-log.md`.

---

## 8. Academic rules

1. **Cite Angel's library.** `Common/MV.js` and `Common/initShaders.js` are not ours.
   Use the citation in `Common/SOURCE.md`.
2. **The senior's project (`cpc354-asgn1`) is an ideas reference only.**
   Do not copy its code or its function names. Our design is different on purpose.
   List it in the report's *External Code* section.
3. **Every member must be able to explain their own code**, line by line, without notes.
   If AI helped you, record it in your AI log, and make sure you understand every line you keep.

---

## 9. Week-4 demo script

About 3 minutes. One person drives; everyone can speak about their own part.

| Time | Do | Say |
|---|---|---|
| 0:00 | Double-click `index.html`. | "This is plain HTML and WebGL. No server, no build tools." |
| 0:20 | Point at the four boxes. | "The word LOGO is centred on the screen. Right now each letter is a placeholder box." |
| 0:40 | Drag **Depth** from 0.5 to 1.5 and back. | "The depth control already rebuilds the 3D shape." |
| 1:00 | Change the **Front** colour. | "Colours are set per vertex, so the front and the sides can differ." |
| 1:20 | Fold the panel (click **Controls**). Press **Space**, or open the panel and press **Start**. | "Jeffry's animation engine is real code: rotate right 180°, then back to the front." |
| 2:00 | Unfold the panel. Point at the yellow badge. | "These parts are still placeholders: geometry is Jason's, rendering is Phing Hong's, camera is Yong Zhou's, controls are Chun Shang's. Each person writes the real one on their own branch." |
| 2:30 | Show `docs/GUIDE.md` and the PR on GitHub. | "This is our plan: who owns what, the shared interface, and our git workflow." |

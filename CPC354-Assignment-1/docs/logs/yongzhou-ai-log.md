# AI log – Yong Zhou (M3)

---

## Entry 1 · 2026-10-21 · Claude Code (Claude Opus 5.5)

**Prompt** (summary):

> Build a running week-4 skeleton and a beginner team guide on a new branch `setup/skeleton`.
> Do not write any member's feature logic (including my own `src/graphics/*`).
> Copy Angel's `MV.js` / `initShaders.js` unchanged. Write `index.html`, `style.css`,
> `src/main.js`, a self-disabling `src/dev/placeholders.js`, `README.md` and `docs/*`.
> No ES modules, no build tools. Verify in a headless browser, then open a PR (do not merge).

Before starting, Claude asked two questions and I chose:
1. M2's three placeholder functions switch off **together** (they share one shader program).
2. The placeholder `getFitScale` measures at the logo's **front face**, not at `z = 0`,
   because the `z = 0` formula makes the enlarged logo too wide (~104 % at depth 0.5).
   The contract text stays as written; the problem is explained in my GUIDE section.

**What the AI gave** (files):

- `Common/MV.js`, `Common/initShaders.js` (copied unchanged, commit `b89242e`), `Common/SOURCE.md`
- `index.html`, `styles/style.css`
- `src/dev/placeholders.js`
- `src/main.js`
- `README.md`, `docs/GUIDE.md`, `docs/logs/TEMPLATE-ai-log.md`, `docs/logs/TEMPLATE-failure-log.md`, this file
- Renamed `src/geometry/cube.js` → `extrude.js`; removed `src/ui/backdrop.js`

**What was wrong / what it found:**

- Its first draft of the `main.js` header labelled `readSettings` as M1 (it is M5). Fixed before commit.
- Testing showed the phase label stays "Ready" for the first 2 s after Start
  (in Jeffry's code; not changed, noted in his GUIDE section).
- The phase label wrapped onto three lines in the panel; fixed in `style.css`.

**What I changed:**

- (fill in after review)

**How I tested it:**

- Claude ran six checks in headless Chrome via `file://` (results are in the PR description).
- I still need to check and understand myself:
  - [ ] `src/main.js` line by line (it is my file; I must explain every line in the viva).
  - [ ] `src/dev/placeholders.js` at a high level: how the `typeof ... !== "function"` check works,
        and why M2's three functions switch off together.
  - [ ] The fit-scale formula in the placeholder, before I write my own `getFitScale`.
  - [ ] Open `index.html` myself by double-click and repeat the checks.

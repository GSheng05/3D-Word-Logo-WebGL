# CPC354 Word Logo — M5 first-phase preview

This checkout contains an M5 interface prototype. From this folder, run
`python -m http.server 8000`, then open `http://localhost:8000/` in a browser.
You can also open `index.html` directly. No dependencies are required.

The preview uses a **mock** logo and simulated animation. It is not yet the
team's WebGL renderer, geometry or animation. Use the right sidebar to edit
the word, extrusion depth, single colour and speed. Start, Pause and Reset are
under the preview. Space toggles playback, R resets, F toggles focus mode and
H hides or shows settings; shortcuts are suppressed while editing controls.
Depth and speed slider limits are provisional until agreed with teammates.

The adapter and mock geometry allow the UI logic to run independently. Connect
the real modules only after synchronizing the latest repository and agreeing
the renderer's colour-buffer format and replacement behaviour. Per-letter
bounds, graphics controls and video recording are later-phase work.

Run the core logic tests from the repository root:

```sh
node --test CPC354-Assignment-1/tests/m5.test.cjs
```

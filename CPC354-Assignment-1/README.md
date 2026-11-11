# Logo Studio

Logo Studio is a browser-based editor for creating and animating 3D word logos in the style of a television ident. Built for CPC354 Computer Graphics and Visualization, it generates a mesh from a 5 × 7 bitmap font and renders it with WebGL. You can change the word, adjust its appearance while previewing it, and export the animation as a video.

## Getting started

Use a WebGL-capable browser and Python 3 to serve the project locally. The app runs as static HTML, CSS and JavaScript.

```sh
git clone https://github.com/GSheng05/3D-Word-Logo-WebGL.git
cd 3D-Word-Logo-WebGL/CPC354-Assignment-1
python3 -m http.server 8000
```

On Windows, run `py -m http.server 8000` in the same folder. Open [http://localhost:8000](http://localhost:8000) and the default `USM` logo will appear in the preview.

## Using Logo Studio

| Panel | What you can do |
| --- | --- |
| **Logo** | Enter 2–4 letters A–Z. Lowercase input is accepted and rendered in uppercase. Adjust block size (0.2–2.0), letter spacing (0–4.0) and extrusion depth (0.2–3.0). Invalid text leaves the last valid logo visible. |
| **Colour** | Choose Single Colour, Front / Side, Per-Letter or Gradient. Apply a palette or edit the colours. Gradients can span the word or repeat across individual letters. |
| **Camera** | Switch between perspective and orthographic projection. The preview fits the logo to the available canvas. |
| **Lighting & material** | Set the light direction and intensity. Choose Matte, Glossy or Metallic and adjust the shininess and specular intensity. |
| **Animation** | Use Start, Pause and Reset below the preview, and set playback speed from 0.5× to 2× in the panel. The logo turns 180° right and returns, turns 180° left and returns, then enlarges and enters a continuous hover. |
| **Export** | Record the animation at 720p or 1080p and download the clip. |

**Keyboard shortcuts:** Space plays or pauses, R resets playback, F toggles Focus mode, and H toggles the settings panel. Click outside the controls before using the shortcuts.

### Exporting a video

Choose a resolution under **Export**, then click **Record from start**. Keep the tab visible during capture. Click **Stop recording** and then **Download video**. Recording starts from the beginning of the animation and stops automatically after 60 seconds.

Export captures the logo canvas against a dark background, targets 30 fps and produces a silent clip. It requires browser support for canvas capture and `MediaRecorder`. The browser determines whether the output is WebM or MP4.

## Project structure

[index.html](index.html) loads the application. [src/main.js](src/main.js) connects the geometry, renderer, camera, animation and UI.

| Path | Responsibility |
| --- | --- |
| [src/geometry/](src/geometry/) | Builds the centred word mesh, validates inputs and returns bounds plus face and letter IDs. |
| [src/rendering/](src/rendering/) | Manages WebGL buffers, shaders, lighting and materials. |
| [src/graphics/](src/graphics/) | Handles the camera, projection, canvas resizing and logo framing. |
| [src/animation/](src/animation/) | Calculates animation phases and poses and manages playback. |
| [src/ui/](src/ui/) | Handles settings, input feedback, colour modes and video export. |
| [styles/](styles/) | Defines the preview and control panel layout. |
| [Common/](Common/) | Contains the bundled WebGL helpers. |

## Testing

Run the automated tests from `CPC354-Assignment-1` with Node.js 18 or newer.

```sh
node --test test/geometry.test.cjs tests/colours.test.cjs tests/integration.test.cjs tests/m5.test.cjs tests/recorder.test.cjs
```

The tests cover mesh generation, colour mapping, UI integration and recorder lifecycle. One geometry boundary test still expects the former input limits. The current validator accepts block size and depth from 0.1 to 10, and letter spacing from 0 to 10. The app sliders use the narrower ranges listed above. See [the boundary test](test/geometry.test.cjs#L84) and [the validator](src/geometry/cube.js#L6).

## Credits and support

Developed by the CPC354 assignment team. The bundled WebGL helpers come from the materials for *Interactive Computer Graphics* by Edward Angel and Dave Shreiner. See [Common/SOURCE.md](Common/SOURCE.md) for source details.

Report problems through [GitHub Issues](https://github.com/GSheng05/3D-Word-Logo-WebGL/issues). Include your browser, the steps to reproduce the issue and any message shown in the preview.

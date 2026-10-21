// =============================================================
// main.js — Start-up and glue between all parts (M3 Yong Zhou)
// -------------------------------------------------------------
// main.js does no maths and no drawing itself. It only calls the
// contract functions (see docs/GUIDE.md) in the right order.
//
// Data flow:
//
//   When a setting changes (word, depth, colour):
//     settings  ->  buildLogo  ->  makeColors  ->  uploadGeometry
//     (M5)          (M1)           (M5)            (M2: copies data to the GPU)
//
//   Every frame (the animation engine calls renderFrame):
//     animation time  ->  model matrix  ->  drawScene
//     (M4)                (M4)              (M2)
//
//   When the window changes size:
//     resizeCanvas -> new aspect ratio -> new fit scale -> renderFrame
//
// Each contract function is either real code from its owner or a
// stand-in from src/dev/placeholders.js. main.js does not care which.
// =============================================================

var canvas          = null;           // the <canvas id="glCanvas"> element
var gl              = null;           // WebGL context, returned by initRenderer()
var aspect          = 1;              // canvas width / height, returned by resizeCanvas()
var currentGeometry = null;           // last result of buildLogo(); we keep it for its bounds
var currentFitScale = 1;              // S: scale that makes the logo fill the screen (M4 will use it)
var projectionMode  = "perspective";  // "perspective" or "orthographic" (M3 extension)

// Start-up. "load" fires after every script and the whole page are ready.
window.addEventListener("load", function () {
    canvas = document.getElementById("glCanvas");
    gl     = initRenderer(canvas);          // M2: get WebGL, compile shaders, depth test on
    aspect = resizeCanvas(canvas, gl);      // M3: match canvas pixels to its size on screen
    initUIControls(rebuild, onResize);      // M5: call rebuild() / onResize() when things change
    initAnimationControls();                // M4: Start / Stop / Reset buttons, speed, keys
    setRenderCallback(renderFrame);         // M4: draw with renderFrame() after every time step
    rebuild();                              // build and draw the first logo
});

// Rebuild the logo from the current settings.
// Called once at start-up, then every time the word, depth or colour changes.
function rebuild() {
    var settings = readSettings();                           // M5: read the control panel
    var word     = sanitizeWord(settings.word);              // M5: "l o g o!" -> "LOGO"; bad input -> "LOGO"
    currentGeometry = buildLogo(word, settings.depth);       // M1: triangles, normals, bounds
    var colors   = makeColors(currentGeometry, settings);    // M5: one RGBA colour per vertex
    uploadGeometry(currentGeometry, colors);                 // M2: copy everything to the GPU
    updateFitScale();                                        // new word or depth -> new size
    renderFrame();                                           // show the result now, even when paused
}

// The window changed size: new aspect ratio, so new projection and new fit scale.
function onResize() {
    aspect = resizeCanvas(canvas, gl);
    updateFitScale();
    renderFrame();
}

// Recompute S, the scale at which the logo fills the screen.
// It depends on the logo size (bounds) and the window shape (aspect).
function updateFitScale() {
    if (currentGeometry) currentFitScale = getFitScale(currentGeometry.bounds, aspect);
}

// Draw one frame. The three matrices take a vertex from the logo to the screen:
//   model      (M4)  where the logo is now: turned, scaled, moved
//   view       (M3)  where the camera is
//   projection (M3)  how 3D is flattened onto the 2D screen
function renderFrame() {
    drawScene(getAnimationModelMatrix(),
              getViewMatrix(),
              getProjectionMatrix(aspect, projectionMode));
}

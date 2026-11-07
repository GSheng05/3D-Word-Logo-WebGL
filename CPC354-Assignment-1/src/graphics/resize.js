// =============================================================
// resize.js — Keeps the canvas drawing size equal to its size on the page (M3)
// -------------------------------------------------------------
// A canvas has two sizes: how big it looks on the page, and how many
// pixels it draws. When they differ, the picture is stretched or blurry.
//
// Depends on: MV.js (radians), camera.js (CAMERA_EYE),
//             projection.js (PROJ_FOVY, projectionMode), phases.js (setMaxScale)
// =============================================================

var trackedCanvas = null;
var trackedGl = null;
var canvasAspect = 1;
var captureSize = null; // {width, height} while recording, otherwise null
var START_FILL = 0.4; // share of the screen the logo fills at the start
var FULL_FILL = 0.9; // share it fills after "scale up"

// Makes the canvas draw this many pixels, and tells WebGL to use all of them.
function setDrawingSize(width, height) {
    trackedCanvas.width = Math.max(1, width);
    trackedCanvas.height = Math.max(1, height);
    trackedGl.viewport(0, 0, trackedCanvas.width, trackedCanvas.height);
    canvasAspect = trackedCanvas.width / trackedCanvas.height;
}

// Matches the drawing size to the size on the page
function resizePreview() {
    // While recording, keep the fixed size; ignore page layout changes
    if (captureSize) {
        return;
    }
    var ratio = window.devicePixelRatio || 1;
    setDrawingSize(Math.round(trackedCanvas.clientWidth * ratio),
                   Math.round(trackedCanvas.clientHeight * ratio));
}

// Call once at startup, After that, any size change is handled by itself
function initResize(canvas, gl) {
    trackedCanvas = canvas;
    trackedGl = gl;
    new ResizeObserver(resizePreview).observe(canvas);
    resizePreview();
}

// For getProjectionMatrix(aspect)
function getCanvasAspect() {
    return canvasAspect;
}

// Recording: draw exactly this many pixels, whatever the page looks like
function beginCaptureSize(width, height) {
    captureSize = {width: width, height: height};
    setDrawingSize(width, height);
}

// Recording finished, follow the page size again
function endCaptureSize() {
    captureSize = null;
    resizePreview();
}

// Returns the scale that makes the logo fill `fill` (e.g. 0.9 = 90%) of the
// screen width or height, whichever runs out first. Measured at the front
// face, because in perspective the closest part looks the biggest.
function getFitScale(bounds, aspect, fill) {
    var dist = CAMERA_EYE[2];
    var t = Math.tan(radians(PROJ_FOVY) / 2);
    var logoHalfW = bounds.size[0] / 2;
    var logoHalfH = bounds.size[1] / 2;
    var front = bounds.max[2]; // z of the front face

    if (projectionMode === "orthographic") {
        var halfH = dist * t; // same box as in projection.js
        return Math.min(fill * halfH * aspect / logoHalfW, fill * halfH / logoHalfH);
    }
    var fitW = fill * dist * t * aspect / (logoHalfW + fill * t * aspect * front);
    var fitH = fill * dist * t / (logoHalfH + fill * t * front);
    return Math.min(fitW, fitH);
}

// Call every frame before drawing. Tells the animation how far to enlarge
// for the current word and window, and returns the starting scale.
function updateFit(bounds) {
    var startScale = getFitScale(bounds, canvasAspect, START_FILL);
    var fullScale = getFitScale(bounds, canvasAspect, FULL_FILL);
    setMaxScale(fullScale / startScale);
    return startScale;
}
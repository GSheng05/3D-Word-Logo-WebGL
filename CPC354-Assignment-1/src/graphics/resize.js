// =============================================================
// resize.js — Keeps the canvas drawing size equal to its size on the page (M3)
// -------------------------------------------------------------
// A canvas has two sizes: how big it looks on the page, and how many
// pixels it draws. When they differ, the picture is stretched or blurry.
//
// Depends on: MV.js (radians), camera.js (CAMERA_EYE),
//             projection.js (PROJ_FOVY, projectionMode)
//             phases.js (setMaxScale, HOVER_ROTATE_DEG, HOVER_TILT_DEG, HOVER_SHIFT_X, HOVER_SHIFT_Y)
// =============================================================

var trackedCanvas = null;
var trackedGl = null;
var canvasAspect = 1;
var captureSize = null; // {width, height} while recording, otherwise null
var resizeCallback = null;
var START_FILL = 0.4; // share of the screen the logo fills at the start
var FULL_FILL = 0.9; // share it fills after "scale up"

// Makes the canvas draw this many pixels, and tells WebGL to use all of them.
function setDrawingSize(width, height) {
    var nextWidth = Math.max(1, width);
    var nextHeight = Math.max(1, height);
    if (trackedCanvas.width !== nextWidth) trackedCanvas.width = nextWidth;
    if (trackedCanvas.height !== nextHeight) trackedCanvas.height = nextHeight;
    trackedGl.viewport(0, 0, trackedCanvas.width, trackedCanvas.height);
    canvasAspect = trackedCanvas.width / trackedCanvas.height;
    if (resizeCallback) resizeCallback();
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
function initResize(canvas, gl, onResize) {
    trackedCanvas = canvas;
    trackedGl = gl;
    resizeCallback = onResize || null;
    var observer = new ResizeObserver(resizePreview);
    observer.observe(canvas);
    resizePreview();
    return function () {
        observer.disconnect();
        resizeCallback = null;
    };
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

// Returns the scale that makes the logo fill `fill` of the screen.
// withHover = true: also plan for the hover in phases.js, which turns,
// tilts and shifts the logo. Each motion is taken at its largest.
function getFitScale(bounds, aspect, fill, withHover) {
    var dist = CAMERA_EYE[2];
    var t = Math.tan(radians(PROJ_FOVY) / 2);
    var halfW = bounds.size[0] / 2;
    var halfH = bounds.size[1] / 2;
    var halfD = bounds.size[2] / 2;

    var turn = withHover ? radians(HOVER_ROTATE_DEG) : 0;
    var tilt = withHover ? radians(HOVER_TILT_DEG) : 0;
    var shiftX = withHover ? HOVER_SHIFT_X : 0;
    var shiftY = withHover ? HOVER_SHIFT_Y : 0;

    // Widest, tallest and closest the logo box can get while hovering.
    var logoHalfW = Math.max(halfW, halfW * Math.cos(turn) + halfD * Math.sin(turn));
    var logoHalfH = Math.max(halfH, halfH * Math.cos(tilt) + halfD * Math.sin(tilt));
    var front = halfW * Math.sin(turn) + halfH * Math.sin(tilt) + halfD;

    if (projectionMode === "orthographic") {
        var boxH = dist * t; // same box as in projection.js
        return Math.min((fill * boxH * aspect - shiftX) / logoHalfW, 
                        (fill * boxH - shiftY) / logoHalfH);
    }
    var fitW = (fill * dist * t * aspect - shiftX) / (logoHalfW + fill * t * aspect * front);
    var fitH = (fill * dist * t - shiftY) / (logoHalfH + fill * t * front);
    return Math.min(fitW, fitH);
}

// Call every frame before drawing. Tells the animation how far to enlarge
// for the current word and window, and returns the starting scale.
function updateFit(bounds) {
    var startScale = getFitScale(bounds, canvasAspect, START_FILL, false);
    var fullScale = getFitScale(bounds, canvasAspect, FULL_FILL, true);
    setMaxScale(fullScale / startScale);
    return startScale;
}

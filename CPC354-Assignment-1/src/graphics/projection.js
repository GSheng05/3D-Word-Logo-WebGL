// =============================================================
// projection.js — How the 3D scene is flattened onto the screen (M3)
// -------------------------------------------------------------
// Perspective: things farther from the camera look smaller.
// Orthographic: same size at any distance.
//
// Depends on: MV.js (perspective, ortho, radians), camera.js (CAMERA_EYE)
// =============================================================

var PROJ_FOVY = 45.0; // how wide the camera sees, top to bottom (degrees)
var PROJ_NEAR = 0.1; // closer than this: not drawn
var PROJ_FAR = 100.0; // farther than this: not drawn
var projectionMode = "perspective"; // "perspective" or "orthographic"

// Called by the UI. Unknown words are ignored, so a typo can't break the picture.
function setProjection(mode) {
    if (mode === "perspective" || mode === "orthographic") {
        projectionMode = mode;
    }
}

// Returns the projection matrix for a canvas with this width / height
function getProjectionMatrix(aspect) {
    if (projectionMode === "orthographic") {
        // Same visible height as perspective at the logo's distance,
        // so switching modes doesn't make the logo jump in size.
        var halfH = CAMERA_EYE[2] * Math.tan(radians(PROJ_FOVY) / 2);
        var halfW = halfH * aspect;
        return ortho(-halfW, halfW, -halfH, halfH, PROJ_NEAR, PROJ_FAR);
    }
    return perspective(PROJ_FOVY, aspect, PROJ_NEAR, PROJ_FAR);
}
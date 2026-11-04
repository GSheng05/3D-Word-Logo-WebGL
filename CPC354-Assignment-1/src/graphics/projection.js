// =============================================================
// projection.js — How the 3D scene is flattened onto the screen (M3)
// -------------------------------------------------------------
// Perspective: things farther from the camera look smaller.
//
// Depends on: MV.js (perspective)
// =============================================================

var PROJ_FOVY = 45.0; // how wide the camera sees, top to bottom (degrees)
var PROJ_NEAR = 0.1; // closer than this: not drawn
var PROJ_FAR = 100.0; // farther than this: not drawn

// Returns the projection matrix for a canvas with this width / height
function getProjectionMatrix(aspect) {
    return perspective(PROJ_FOVY, aspect, PROJ_NEAR, PROJ_FAR);
}
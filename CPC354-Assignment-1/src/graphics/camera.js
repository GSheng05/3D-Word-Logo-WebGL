// =============================================================
// camera.js — Where the camera stands and where it looks (M3)
// -------------------------------------------------------------
// The camera stands on the +z axis and looks at the origin,
// where the logo is centred. y is "up" on the screen.
//
// Depends on: MV.js (vec3, lookAt)
// =============================================================

var CAMERA_EYE = vec3(0.0, 0.0, 4.0);   // where the camera stands
var CAMERA_AT = vec3(0.0, 0.0, 0.0);    // the point it looks at (logo centre)
var CAMERA_UP = vec3(0.0, 1.0, 0.0);    // which way is "up" on the screen

// Returns the view matrix: it moves the whole world so the camera
// ends up at the origin, looking down the -z axis.
function getViewMatrix() {
    return lookAt(CAMERA_EYE, CAMERA_AT, CAMERA_UP);
}
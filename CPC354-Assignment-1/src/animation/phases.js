// phases.js — The animation sequence and the maths for each phase.
// No WebGL and no buttons here, only numbers.

var PHASE_TIME = 2.0;   // seconds per phase
var maxScale   = 2.5;   // biggest size, reached at the end of "Scale up"

var HOVER_PERIOD     = 4.0;   // seconds per full sway
var HOVER_RAMP       = 1.0;   // seconds to fade the hover in
var HOVER_ROTATE_DEG = 20;
var HOVER_TILT_DEG   = 6;
var HOVER_SHIFT_X    = 0.05;  // world units
var HOVER_SHIFT_Y    = 0.08;  // world units

// The last phase (Hover) never ends, so the logo keeps moving until Stop or Reset.
var phaseNames = [
    "Rotate right 180°",
    "Return to front",
    "Rotate left 180°",
    "Return to front",
    "Scale up",
    "Hover"
];
var LAST_PHASE = phaseNames.length - 1;

// Current pose of the logo, set by updatePose().
var phase      = 0;
var rotY       = 0;   // degrees; positive = front turns right
var rotX       = 0;   // degrees
var scaleValue = 1;
var posX       = 0;
var posY       = 0;

// Changes how big the logo gets, so the size can be matched to the word and window.
function setMaxScale(value) {
    maxScale = value;
}

// Slow at the start and end of a phase, fast in the middle (p goes 0 -> 1).
function smooth(p) {
    return 0.5 - 0.5 * Math.cos(Math.PI * p);
}

// Works out the pose of the logo at a given animation time (seconds).
function updatePose(time) {
    rotY = 0;
    rotX = 0;
    scaleValue = 1;
    posX = 0;
    posY = 0;

    phase = Math.floor(time / PHASE_TIME);
    if (phase > LAST_PHASE) phase = LAST_PHASE;

    var phaseTime = time - phase * PHASE_TIME;   // time since this phase started
    var p = smooth(Math.min(phaseTime / PHASE_TIME, 1));

    if (phase === 0)      rotY = 180 * p;
    else if (phase === 1) rotY = 180 - 180 * p;
    else if (phase === 2) rotY = -180 * p;
    else if (phase === 3) rotY = -180 + 180 * p;
    else if (phase === 4) scaleValue = 1 + (maxScale - 1) * p;
    else {
        scaleValue = maxScale;   // stay enlarged while hovering
        hover(phaseTime);
    }
}

// Every term is a sine of time, so the hover starts at the resting pose;
// the ramp fades the motion in to avoid a sudden jerk.
function hover(t) {
    var angle = 2 * Math.PI * t / HOVER_PERIOD;
    var ramp  = smooth(Math.min(t / HOVER_RAMP, 1));

    rotY = ramp * HOVER_ROTATE_DEG * Math.sin(angle);
    rotX = ramp * HOVER_TILT_DEG   * Math.sin(2 * angle);
    posX = ramp * HOVER_SHIFT_X    * Math.sin(angle);
    posY = ramp * HOVER_SHIFT_Y    * Math.sin(2 * angle);   // twice the rate = figure-of-eight path
}

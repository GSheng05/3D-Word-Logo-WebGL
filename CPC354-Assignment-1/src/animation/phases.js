// =============================================================
// phases.js — Animation phase definitions and per-phase maths
// -------------------------------------------------------------
// The TV ident is a fixed sequence of seven phases. Each phase
// has a duration in seconds (at 1x speed). Given the current
// animation time t, getPhase() finds which phase we are in and
// how far through it we are (progress 0..1). computeTransform()
// then turns that into rotation / scale / translation values.
//
// This file is pure maths: no WebGL, no DOM, no timers.
// =============================================================

// Peak scale reached at the end of phase 5 ("full-screen" size).
var MAX_SCALE = 2.5;

// Phase 7 (hover) parameters.
var HOVER_PERIOD     = 4.0;   // seconds for one full side-to-side sway
var HOVER_RAMP       = 1.0;   // seconds to fade the hover motion in
var HOVER_ROTATE_DEG = 20;    // max turn left/right about the y-axis (degrees)
var HOVER_TILT_DEG   = 6;     // max tilt forward/back about the x-axis (degrees)
var HOVER_SHIFT_X    = 0.05;  // max drift left/right (world units)
var HOVER_SHIFT_Y    = 0.08;  // max bob up/down (world units)

// The sequence. The last phase never ends, so the logo keeps
// "moving about" until the user presses Stop or Reset.
var PHASES = [
    { name: "Rotate right 180°", duration: 2.0 },
    { name: "Return to front",        duration: 2.0 },
    { name: "Rotate left 180°",  duration: 2.0 },
    { name: "Return to front",        duration: 2.0 },
    { name: "Scale up",               duration: 2.0 },
    { name: "Scale down",             duration: 2.0 },
    { name: "Hover",                  duration: Infinity }
];

// The logo's resting pose: centred, facing the viewer, normal size.
function initialTransform() {
    return {
        rotY:  0,   // degrees about the y-axis (positive = front turns right)
        rotX:  0,   // degrees about the x-axis
        scale: 1,   // uniform scale factor
        posX:  0,   // translation in x
        posY:  0,   // translation in y
        phaseIndex: 0,
        phaseName:  PHASES[0].name
    };
}

// Find the phase that contains animation time t (seconds).
// Walks the phase list, subtracting each duration until t falls inside one.
function getPhase(t) {
    var start = 0;
    for (var i = 0; i < PHASES.length; i++) {
        var duration = PHASES[i].duration;
        if (t < start + duration) {
            var localTime = t - start;
            return {
                index:     i,
                name:      PHASES[i].name,
                localTime: localTime,             // seconds since this phase began
                progress:  localTime / duration   // 0..1 (always 0 for the infinite hover)
            };
        }
        start += duration;
    }

    // Only reached if every phase has a finite duration: hold the final pose.
    var last = PHASES.length - 1;
    return { index: last, name: PHASES[last].name, localTime: PHASES[last].duration, progress: 1 };
}

// Cosine ease-in-out: maps 0..1 to 0..1 but starts and ends with zero
// velocity, so the logo accelerates out of each pose and settles into the next.
function easeInOut(p) {
    return 0.5 - 0.5 * Math.cos(Math.PI * p);
}

// Linear interpolation between a and b by p (0..1).
function lerp(a, b, p) {
    return a + (b - a) * p;
}

// Compute the full transform for animation time t.
function computeTransform(t) {
    var phase = getPhase(t);
    var p = easeInOut(phase.progress);
    var tf = initialTransform();

    switch (phase.index) {
        case 0: tf.rotY = lerp(0, 180, p);         break;  // rotate right 180
        case 1: tf.rotY = lerp(180, 0, p);         break;  // back to front
        case 2: tf.rotY = lerp(0, -180, p);        break;  // rotate left 180
        case 3: tf.rotY = lerp(-180, 0, p);        break;  // back to front
        case 4: tf.scale = lerp(1, MAX_SCALE, p);  break;  // enlarge
        case 5: tf.scale = lerp(MAX_SCALE, 1, p);  break;  // shrink back
        case 6: applyHover(tf, phase.localTime);   break;  // move about
    }

    tf.phaseIndex = phase.index;
    tf.phaseName  = phase.name;
    return tf;
}

// Gentle looping motion for phase 7. Every term is a sine of time, so at
// localTime = 0 they are all zero and the hover continues smoothly from the
// resting pose. The ramp fades the motion in over HOVER_RAMP seconds so it
// does not start with a sudden jerk.
function applyHover(tf, localTime) {
    var w = 2 * Math.PI * localTime / HOVER_PERIOD;           // angle in radians
    var ramp = easeInOut(Math.min(localTime / HOVER_RAMP, 1));

    tf.rotY = ramp * HOVER_ROTATE_DEG * Math.sin(w);
    tf.rotX = ramp * HOVER_TILT_DEG   * Math.sin(2 * w);
    tf.posX = ramp * HOVER_SHIFT_X    * Math.sin(w);
    tf.posY = ramp * HOVER_SHIFT_Y    * Math.sin(2 * w);      // twice the rate = figure-of-eight path
}

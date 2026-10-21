// =============================================================
// animation.js — Animation engine: timing, loop and model matrix
// -------------------------------------------------------------
// Each frame runs this pipeline:
//
//   performance.now()            real time (ms)
//        |  minus last frame's time
//   real delta time (s)
//        |  x speed factor (slider / 60)
//   animation time (elapsed)
//        |  getPhase() / computeTransform()   (phases.js)
//   rotation, scale, translation
//        |  getAnimationModelMatrix()
//   render()                     drawn by main.js
//        |
//   requestAnimationFrame(animate)   schedule the next frame
//
// Speed is applied to each frame's delta, not to the total time. That
// way, moving the speed slider changes how fast time advances from now
// on, without making the logo jump to a different point in the sequence.
//
// Depends on: MV.js (mat4, mult, translate, rotate), phases.js
// =============================================================

var BASE_SPEED   = 60;   // slider value that means normal (1x) speed
var MAX_FRAME_DT = 0.1;  // longest step allowed per frame (s), avoids a jump after the tab was hidden

var animState = {
    running:     false,
    elapsed:     0,                    // animation time in seconds (already speed-scaled)
    lastTime:    0,                    // performance.now() at the previous frame (ms)
    frameId:     null,                 // id from requestAnimationFrame, needed to cancel it
    speedFactor: 1,                    // 1 = normal, 2 = double speed, 0.5 = half speed
    transform:   initialTransform()    // current pose of the logo
};

var renderCallback      = null;  // main.js's render(), called after every update
var phaseChangeCallback = null;  // optional, called when the phase changes (used by the UI)

// ---- Hooks for other modules --------------------------------

function setRenderCallback(fn)      { renderCallback = fn; }
function setPhaseChangeCallback(fn) { phaseChangeCallback = fn; }

// Convert the speed slider value into a multiplier (60 -> 1x, 120 -> 2x).
// Takes effect on the very next frame.
function setAnimationSpeed(sliderValue) {
    animState.speedFactor = sliderValue / BASE_SPEED;
}

function isAnimationRunning() { return animState.running; }
function getAnimationState()  { return animState; }

// ---- The loop -----------------------------------------------

// One frame: advance time, update the pose, draw, schedule the next frame.
function animate() {
    var now = performance.now();
    var dt  = Math.min((now - animState.lastTime) / 1000, MAX_FRAME_DT);
    animState.lastTime = now;

    animState.elapsed += dt * animState.speedFactor;
    updateTransform();
    requestRender();

    animState.frameId = requestAnimationFrame(animate);
}

// Recompute the pose from the current animation time and report phase changes.
function updateTransform() {
    var previousPhase = animState.transform.phaseIndex;
    animState.transform = computeTransform(animState.elapsed);

    if (phaseChangeCallback && animState.transform.phaseIndex !== previousPhase) {
        phaseChangeCallback(animState.transform);
    }
}

function requestRender() {
    if (renderCallback) renderCallback();
}

// ---- Start / Stop / Reset -----------------------------------

// Start, or resume after Stop. lastTime is set to "now" so the time spent
// paused is not counted as one huge frame.
function startAnimation() {
    if (animState.running) return;
    animState.running  = true;
    animState.lastTime = performance.now();
    animState.frameId  = requestAnimationFrame(animate);
}

// Pause. elapsed is kept, so Start resumes from exactly the same point.
function stopAnimation() {
    if (!animState.running) return;
    animState.running = false;
    cancelAnimationFrame(animState.frameId);
    animState.frameId = null;
}

// Cancel the pending frame and put the logo back in its starting pose.
function resetAnimation() {
    stopAnimation();
    animState.elapsed   = 0;
    animState.transform = initialTransform();
    if (phaseChangeCallback) phaseChangeCallback(animState.transform);
    requestRender();
}

// ---- Model matrix -------------------------------------------

// M = T * Ry * Rx * S
// Read right to left: scale the logo, tilt it, turn it, then move it.
// Scaling and rotating happen about the origin, so the word geometry
// must be centred on (0, 0, 0) for it to spin and grow in place.
function getAnimationModelMatrix() {
    var tf = animState.transform;
    var m = translate(tf.posX, tf.posY, 0);
    m = mult(m, rotate(tf.rotY, [0, 1, 0]));
    m = mult(m, rotate(tf.rotX, [1, 0, 0]));
    m = mult(m, uniformScale(tf.scale));
    return m;
}

// Uniform scale matrix (built by hand because MV.js versions differ
// on whether this is called scale() or scalem()).
function uniformScale(s) {
    var m = mat4();   // identity
    m[0][0] = s;
    m[1][1] = s;
    m[2][2] = s;
    return m;
}

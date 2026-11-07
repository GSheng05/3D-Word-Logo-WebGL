// animation.js — Animation loop: Start / Stop / Reset, speed and model matrix.
// Depends on: MV.js (mult, translate, rotateX, rotateY, scale), phases.js
//
// Speed is applied to each frame's time step, not to the total time, so moving
// the speed slider never makes the logo jump to a different point in the sequence.

var BASE_SPEED = 60;    // setAnimationSpeed() value that means 1x speed

var time     = 0;       // animation time in seconds (already speed-scaled)
var speed    = 1;       // 1 = normal, 2 = double speed
var running  = false;
var lastTime = 0;       // ms, time of the previous frame
var frameId  = null;    // needed to cancel the next frame on Stop

var renderFunction = null;   // the page's render(), called after every update
var frameFunction  = null;   // optional, called after every frame (e.g. to update labels)

function setRenderCallback(fn) {
    renderFunction = fn;
}

function setFrameCallback(fn) {
    frameFunction = fn;
}

function requestRender() {
    if (renderFunction) renderFunction();
}

// 60 -> 1x, 120 -> 2x.
function setAnimationSpeed(value) {
    speed = value / BASE_SPEED;
}

// The current state, for the UI to read.
function getAnimationState() {
    return {
        running: running,
        elapsed: time,
        transform: { phaseName: phaseNames[phase] }
    };
}

function animate(now) {
    var dt = (now - lastTime) / 1000;
    lastTime = now;
    if (dt < 0) dt = 0;       // the first frame's time can be just before Start
    if (dt > 0.1) dt = 0.1;   // avoids a jump after the tab was hidden

    time = time + dt * speed;
    updatePose(time);
    requestRender();
    if (frameFunction) frameFunction();

    // A render/frame callback can pause playback after a drawing error.
    if (running) frameId = requestAnimationFrame(animate);
}

// lastTime is reset so the time spent paused is not counted as one huge frame.
function startAnimation() {
    if (running) return;
    running  = true;
    lastTime = performance.now();
    frameId  = requestAnimationFrame(animate);
}

function stopAnimation() {
    running = false;
    cancelAnimationFrame(frameId);
}

function resetAnimation() {
    stopAnimation();
    time = 0;
    updatePose(time);
    requestRender();
}

// M = T * Ry * Rx * S. Scaling and rotation happen about the origin, so the
// word geometry must be centred on (0, 0, 0) to spin and grow in place.
// rotateY/rotateX are used instead of rotate(): in this MV.js, rotate() builds
// the transpose, which would turn the logo the opposite way.
function getAnimationModelMatrix() {
    var m = translate(posX, posY, 0);
    m = mult(m, rotateY(rotY));
    m = mult(m, rotateX(rotX));
    m = mult(m, scale(scaleValue, scaleValue, scaleValue));
    return m;
}

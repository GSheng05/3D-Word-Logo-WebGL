// =============================================================
// animationControls.js — Start / Stop / Reset, speed and keys
// -------------------------------------------------------------
// Connects the HTML controls to the animation engine and keeps the
// buttons and labels in sync with its state. Missing elements are
// skipped, so the page still works if a control is left out.
//
// Keyboard:  Space = start / pause    R = reset
//            + / -  = faster / slower
//
// Depends on: animation.js, phases.js
// =============================================================

// Element ids expected in index.html.
var ANIM_UI_IDS = {
    start:      "startBtn",
    stop:       "stopBtn",
    reset:      "resetBtn",
    speed:      "speedSlider",
    speedLabel: "speedValue",
    phaseLabel: "phaseLabel"
};

function animEl(key) {
    return document.getElementById(ANIM_UI_IDS[key]);
}

// Wire up all animation controls. Call once from main.js after the page loads.
function initAnimationControls() {
    bindButton(animEl("start"), startAnimation);
    bindButton(animEl("stop"),  stopAnimation);
    bindButton(animEl("reset"), resetAnimation);

    var slider = animEl("speed");
    if (slider) {
        // "input" fires continuously while dragging, so speed changes live.
        slider.addEventListener("input", function () {
            setAnimationSpeed(Number(slider.value));
            updateAnimationUI();
        });
        setAnimationSpeed(Number(slider.value));   // pick up the initial slider value
    }

    setPhaseChangeCallback(updateAnimationUI);
    document.addEventListener("keydown", handleAnimationKeys);
    updateAnimationUI();
}

// Run an animation action on click, then refresh the UI. The button is
// blurred afterwards so a later Space press goes to our shortcut instead
// of "clicking" the focused button a second time.
function bindButton(button, action) {
    if (!button) return;
    button.addEventListener("click", function () {
        action();
        updateAnimationUI();
        button.blur();
    });
}

function handleAnimationKeys(e) {
    // Do not steal keys while the user is typing or adjusting a form control.
    var tag = e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    switch (e.key) {
        case " ":
            e.preventDefault();   // stop Space from scrolling the page
            if (isAnimationRunning()) stopAnimation(); else startAnimation();
            break;
        case "r":
        case "R":
            resetAnimation();
            break;
        case "+":
        case "=":
            nudgeSpeed(+1);
            break;
        case "-":
            nudgeSpeed(-1);
            break;
        default:
            return;
    }
    updateAnimationUI();
}

// Move the speed slider one step up or down and apply it.
function nudgeSpeed(direction) {
    var slider = animEl("speed");
    if (!slider) return;
    if (direction > 0) slider.stepUp(); else slider.stepDown();
    setAnimationSpeed(Number(slider.value));
}

// Refresh button states and labels from the engine's current state.
function updateAnimationUI() {
    var state   = getAnimationState();
    var started = state.elapsed > 0;

    var startBtn = animEl("start");
    if (startBtn) {
        startBtn.disabled    = state.running;
        startBtn.textContent = (started && !state.running) ? "Resume" : "Start";
    }

    var stopBtn = animEl("stop");
    if (stopBtn) stopBtn.disabled = !state.running;

    var speedLabel = animEl("speedLabel");
    if (speedLabel) speedLabel.textContent = state.speedFactor.toFixed(2) + "×";

    var phaseLabel = animEl("phaseLabel");
    if (phaseLabel) {
        var phase = (state.transform.phaseIndex + 1) + "/" + PHASES.length + " – " + state.transform.phaseName;
        if (!started)            phaseLabel.textContent = "Ready";
        else if (state.running)  phaseLabel.textContent = phase;
        else                     phaseLabel.textContent = "Paused – " + phase;
    }
}

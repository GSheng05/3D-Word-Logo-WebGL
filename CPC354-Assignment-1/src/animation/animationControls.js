// animationControls.js — Buttons, speed slider and keyboard shortcuts.
// Depends on: animation.js, phases.js
// The page needs: startBtn, stopBtn, resetBtn, speedSlider, speedValue, phaseLabel
//
// Only for animation_test.html and test/animation-test.html. index.html has its own
// controls in src/ui, so it must not load this file or call initAnimationControls().

function initAnimationControls() {
    // blur() takes focus off the button, so a later Space press goes to our
    // shortcut instead of clicking the same button again.
    document.getElementById("startBtn").onclick = function () {
        startAnimation();
        updateAnimationUI();
        this.blur();
    };
    document.getElementById("stopBtn").onclick = function () {
        stopAnimation();
        updateAnimationUI();
        this.blur();
    };
    document.getElementById("resetBtn").onclick = function () {
        resetAnimation();
        updateAnimationUI();
        this.blur();
    };

    var slider = document.getElementById("speedSlider");
    slider.oninput = function () {
        setAnimationSpeed(slider.value);
        updateAnimationUI();
    };
    setAnimationSpeed(slider.value);

    setFrameCallback(updateAnimationUI);
    window.addEventListener("keydown", handleKeys);
    updateAnimationUI();
}

function handleKeys(event) {
    if (event.target.tagName === "INPUT") return;   // don't steal keys from text boxes or the slider

    var slider = document.getElementById("speedSlider");

    if (event.key === " ") {
        event.preventDefault();   // stop Space from scrolling the page
        if (running) stopAnimation();
        else         startAnimation();
    }
    else if (event.key === "r" || event.key === "R") {
        resetAnimation();
    }
    else if (event.key === "+" || event.key === "=") {
        slider.stepUp();
        setAnimationSpeed(slider.value);
    }
    else if (event.key === "-") {
        slider.stepDown();
        setAnimationSpeed(slider.value);
    }

    updateAnimationUI();
}

function updateAnimationUI() {
    var started = time > 0;

    var startBtn = document.getElementById("startBtn");
    startBtn.disabled = running;
    if (started && !running) startBtn.textContent = "Resume";
    else                     startBtn.textContent = "Start";

    document.getElementById("stopBtn").disabled = !running;

    document.getElementById("speedValue").textContent = speed.toFixed(2) + "×";

    var phaseText = (phase + 1) + "/" + phaseNames.length + " – " + phaseNames[phase];
    var phaseLabel = document.getElementById("phaseLabel");
    if (!started)     phaseLabel.textContent = "Ready";
    else if (running) phaseLabel.textContent = phaseText;
    else              phaseLabel.textContent = "Paused – " + phaseText;
}

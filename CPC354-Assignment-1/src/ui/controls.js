// =============================================================
// controls.js - M5 settings, labels and mock preview presentation
// -------------------------------------------------------------
// Reads session/playback state and updates the existing HTML elements.
// Event registration is handled separately by events.js.
//
// Public API: M5.initControls(doc, state, adapter) -> view methods
// Depends on: adapter.js, state.js and the IDs defined in index.html.
// Current preview uses CSS text/motion, not the WebGL renderer.
// =============================================================
(function (root) {
  'use strict';
  const M5 = root.M5;
  function initControls(doc, state, adapter) {
    const get = id => doc.getElementById(id);
    const app = get('app');
    // Applies sidebar and Focus Mode flags, synchronizes accessibility
    // attributes and requests a viewport resize for the updated layout.
    function renderLayout() {
      app.classList.toggle('is-hidden', !state.sidebarOpen);
      app.classList.toggle('is-focus', state.focus);
      get('sidebarBtn').setAttribute('aria-expanded', String(state.sidebarOpen));
      get('sidebarBtn').textContent = state.sidebarOpen ? 'Hide settings' : 'Show settings';
      get('focusBtn').setAttribute('aria-pressed', String(state.focus));
      get('restoreSidebarBtn').hidden = state.sidebarOpen || state.focus;
      get('exitFocusBtn').hidden = !state.focus;
      adapter.resizePreview();
    }
    // Mocks do not advance elapsed time automatically. Track whether
    // Start was used so Pause still displays Resume instead of Start.
    let started = false;
    function renderPlayback() {
      const playing = adapter.getPlayback().running;
      if (playing) started = true;
      get('startBtn').disabled = playing;
      get('stopBtn').disabled = !playing;
      get('startBtn').querySelector('span').textContent = started && !playing ? 'Resume' : 'Start';
      get('phaseLabel').textContent = playing ? 'Playing' : started ? 'Paused' : 'Ready';
      get('logo').classList.toggle('playing', playing);
    }
    // Called after resetting the engine; only resets playback labels.
    function resetPlayback() { started = false; renderPlayback(); }
    // Validation results update feedback without replacing a valid logo
    // with the invalid draft text. textContent avoids interpreting HTML.
    function renderWord(result) {
      const input = get('wordInput');
      input.setAttribute('aria-invalid', String(!result.ok));
      get('wordError').textContent = result.ok ? '' : result.error;
      get('wordCount').textContent = input.value.length + ' / 4';
      if (result.ok) get('logo').textContent = state.renderedWord;
    }
    // Simulate colour/depth/speed for independent UI review. CSS shadows
    // are not geometric extrusion; --duration drives mock CSS motion.
    function renderPreview() {
      const logo = get('logo');
      logo.textContent = state.renderedWord || 'USM';
      logo.style.color = state.colour;
      logo.style.setProperty('--duration', (4 / state.speed) + 's');
      const depth = state.depth;
      logo.style.textShadow = `${depth * 2}px ${depth * 3}px #4e69a2, ${depth * 4}px ${depth * 6}px #3b5081, 7px 10px 20px #0008`;
      get('colourValue').textContent = state.colour.toUpperCase();
      get('depthValue').textContent = state.depth.toFixed(1);
      get('speedValue').textContent = state.speed.toFixed(1) + '×';
    }
    // Paint initial values and expose cleanup for later teardown.
    const unsubscribe = adapter.subscribePlayback(renderPlayback);
    renderLayout(); renderPlayback(); renderPreview();
    return { renderLayout, renderPlayback, resetPlayback, renderWord, renderPreview, dispose: unsubscribe };
  }
  M5.initControls = initControls;
})(window);

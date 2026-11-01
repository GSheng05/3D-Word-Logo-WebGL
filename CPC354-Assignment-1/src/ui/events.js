// =============================================================
// events.js - M5 input events, shortcuts and mock startup
// -------------------------------------------------------------
// Input -> state update through adapter -> view refresh.
// Keyboard: Space = play/pause, R = reset, F = focus, H = sidebar.
//
// Public API: M5.initEvents(doc, state, adapter, view) -> cleanup
// Depends on: adapter.js, mocks.js, state.js, controls.js and page IDs.
// Registers the prototype's button and keyboard listeners.
// Duplicate control initialization would trigger actions more than once.
// =============================================================
(function (root) {
  'use strict';
  const M5 = root.M5;
  function initEvents(doc, state, adapter, view) {
    const get = id => doc.getElementById(id);
    // Pair each listener with its removal so teardown does not leave
    // duplicate handlers if the interface is later mounted again.
    const cleanups = [];
    function on(element, event, handler) {
      element.addEventListener(event, handler);
      cleanups.push(() => element.removeEventListener(event, handler));
    }
    function toggleSidebar() { state.sidebarOpen = !state.sidebarOpen; view.renderLayout(); }
    function toggleFocus() { state.focus = !state.focus; view.renderLayout(); }
    function togglePlayback() { if (adapter.getPlayback().running) adapter.pause(); else adapter.play(); }
    on(get('sidebarBtn'), 'click', toggleSidebar);
    on(get('restoreSidebarBtn'), 'click', toggleSidebar);
    on(get('focusBtn'), 'click', toggleFocus);
    on(get('exitFocusBtn'), 'click', toggleFocus);
    on(get('startBtn'), 'click', () => adapter.play());
    on(get('stopBtn'), 'click', () => adapter.pause());
    on(get('resetBtn'), 'click', () => { adapter.reset(); view.resetPlayback(); adapter.requestRender(); });
    // Wait for IME composition to finish before validating intermediate
    // text. Invalid results leave the last successfully rendered word.
    on(get('wordInput'), 'input', event => {
      if (event.isComposing) return;
      const result = M5.applyWord(state, event.target.value, adapter);
      view.renderWord(result); view.renderPreview();
    });
    on(get('wordInput'), 'compositionend', event => {
      const result = M5.applyWord(state, event.target.value, adapter);
      view.renderWord(result); view.renderPreview();
    });
    // input fires throughout dragging for live preview. Revert the
    // displayed slider to its committed value if rebuilding fails.
    on(get('depthSlider'), 'input', event => {
      const result = M5.applyDepth(state, Number(event.target.value), adapter);
      if (!result.ok) { get('statusMessage').textContent = result.error; event.target.value = state.depth; }
      view.renderPreview();
    });
    on(get('colourInput'), 'input', event => {
      const result = M5.applyColour(state, event.target.value, adapter);
      if (!result.ok) get('statusMessage').textContent = result.error;
      view.renderPreview();
    });
    on(get('speedSlider'), 'input', event => {
      const speed = Number(event.target.value); adapter.setSpeed(speed); state.speed = speed; view.renderPreview();
    });
    // Avoid stealing text editing, native focused-button activation,
    // modifier shortcuts or key-repeat actions from the browser.
    on(doc, 'keydown', event => {
      if (event.isComposing || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName))) return;
      const key = event.key.toLowerCase();
      // Reserve the recording flag for the later recorder integration.
      // This guards shortcuts only; a full recording lock comes later.
      if ((key === ' ' || key === 'r') && state.recording) return;
      if (key === ' ') { event.preventDefault(); togglePlayback(); }
      else if (key === 'r') { adapter.reset(); view.resetPlayback(); adapter.requestRender(); }
      else if (key === 'f') toggleFocus();
      else if (key === 'h') toggleSidebar();
    });
    return () => cleanups.splice(0).forEach(cleanup => cleanup());
  }
  M5.initEvents = initEvents;
  // Starts the mock preview: creates state and bindings, builds the initial
  // logo, initializes the view/events and registers unload cleanup.
  function start() {
    const state = M5.createState();
    const bindings = M5.createMockBindings();
    const adapter = M5.createAdapter(bindings);
    M5.applyWord(state, state.draftWord, adapter);
    const view = M5.initControls(document, state, adapter);
    const disposeEvents = M5.initEvents(document, state, adapter, view);
    root.addEventListener('beforeunload', () => { disposeEvents(); view.dispose(); }, { once: true });
  }
  // Wait for page elements if scripts are loaded before DOM readiness.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})(window);

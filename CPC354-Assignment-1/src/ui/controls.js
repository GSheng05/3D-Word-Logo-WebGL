// controls.js - Updates the interface from current settings and playback state.
(function (root) {
  'use strict';
  const M5 = root.M5;
  function initControls(doc, state, adapter) {
    const get = id => doc.getElementById(id);
    // Show or hide interface panels and resize the preview.
    function renderLayout() {
      get('app').classList.toggle('is-hidden', !state.sidebarOpen);
      get('app').classList.toggle('is-focus', state.focus);
      get('sidebarBtn').setAttribute('aria-expanded', String(state.sidebarOpen));
      get('sidebarBtn').textContent = state.sidebarOpen ? 'Hide settings' : 'Show settings';
      get('focusBtn').setAttribute('aria-pressed', String(state.focus));
      get('restoreSidebarBtn').hidden = state.sidebarOpen || state.focus;
      get('exitFocusBtn').hidden = !state.focus;
      adapter.resizePreview();
    }
    let started = false;
    // Update playback labels and disable buttons that cannot be used.
    function renderPlayback() {
      const playback = adapter.getPlayback();
      if (playback.running) started = true;
      get('startBtn').disabled = state.recording || playback.running;
      get('stopBtn').disabled = state.recording || !playback.running;
      get('resetBtn').disabled = state.recording;
      get('startBtn').querySelector('span').textContent = started && !playback.running ? 'Resume' : 'Start';
      get('phaseLabel').textContent = (playback.running ? 'Playing' : started ? 'Paused' : 'Ready') + ' - ' + playback.phaseName;
    }
    function resetPlayback() { started = false; renderPlayback(); }
    function renderWord(result) {
      get('wordInput').setAttribute('aria-invalid', String(!result.ok));
      get('wordError').textContent = result.ok ? '' : result.error;
      get('wordCount').textContent = get('wordInput').value.length + ' / 4';
    }
    function renderPreview() {
      get('previewCaption').textContent = state.renderedWord + ' - real-time WebGL';
      get('blockSizeValue').textContent = state.blockSize.toFixed(1);
      get('blockSizeSlider').value = state.blockSize;
      get('letterSpacingValue').textContent = state.letterSpacing.toFixed(1);
      get('letterSpacingSlider').value = state.letterSpacing;
      get('depthValue').textContent = state.depth.toFixed(1);
      get('depthSlider').value = state.depth;
      get('speedValue').textContent = state.speed.toFixed(1) + 'x';
    }
    // Build colour controls for the selected mode using validated settings.
    function renderColours() {
      const settings = state.colours, mode = settings.mode, value = settings[mode];
      get('colourMode').value = mode;
      get('paletteSelect').value = value.palette;
      const picker = (label, field, colour, index = '') => `<div class="colour-picker"><label for="pick-${field}-${index}">${label}</label><input id="pick-${field}-${index}" type="color" data-field="${field}" data-index="${index}" value="${colour}"></div>`;
      let html = '';
      if (mode === 'single') html = picker('Logo colour', 'colour', value.colour);
      if (mode === 'faces') html = picker('Front', 'front', value.front) + picker('Sides and back', 'side', value.side);
      if (mode === 'letters') html = [...state.renderedWord].map((letter, i) => picker(`Letter ${i + 1}: ${letter}`, 'colours', value.colours[i], i)).join('');
      if (mode === 'gradient') {
        html = value.colours.map((colour, i) => picker(`Stop ${i + 1}`, 'colours', colour, i)).join('');
        html += `<button type="button" data-action="add" ${value.colours.length === 4 ? 'disabled' : ''}>Add stop</button><button type="button" data-action="remove" ${value.colours.length === 2 ? 'disabled' : ''}>Remove last stop</button>
          <label for="directionPreset">Direction</label><select id="directionPreset"><option>Horizontal</option><option>Vertical</option><option>Diagonal</option><option>Custom</option></select>
          <label for="gradientAngle">Angle <output id="angleValue">${value.angle} degrees</output></label><input id="gradientAngle" type="range" min="0" max="360" value="${value.angle}">
          <p class="helper">Object directions: 0 degrees left to right, 90 bottom to top, 45 diagonal. Stops are equally spaced.</p>
          <label for="gradientCoverage">Coverage</label><select id="gradientCoverage"><option value="word">Whole word</option><option value="letter">Each letter</option></select>
          <label for="gradientSurface">Surface</label><select id="gradientSurface"><option value="all">All faces</option><option value="front">Front only</option></select>`;
        if (value.surface === 'front') html += picker('Sides and back', 'side', value.side);
      }
      get('colourFields').innerHTML = html;
      if (mode === 'gradient') {
        get('directionPreset').value = value.direction;
        get('gradientCoverage').value = value.coverage;
        get('gradientSurface').value = value.surface;
      }
    }
    function renderGraphics() {
      get('projectionSelect').value = state.projection;
      get('lightPreset').value = state.lightPreset;
      ['horizontal', 'vertical', 'intensity'].forEach(key => {
        const id = 'light' + key[0].toUpperCase() + key.slice(1);
        get(id).value = state.light[key]; get(id + 'Value').textContent = state.light[key];
      });
      get('materialPreset').value = state.material;
      const material = state.materials[state.material];
      get('shininessSlider').value = material.shininess;
      get('shininessValue').textContent = material.shininess;
      get('specularSlider').value = material.specularIntensity;
      get('specularValue').textContent = material.specularIntensity;
    }
    const unsubscribe = adapter.subscribePlayback(renderPlayback);
    renderLayout(); renderPlayback(); renderPreview(); renderColours(); renderGraphics();
    return { renderLayout, renderPlayback, resetPlayback, renderWord, renderPreview, renderColours, renderGraphics, dispose: unsubscribe };
  }
  M5.initControls = initControls;
})(window);

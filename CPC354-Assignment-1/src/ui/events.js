// events.js - Handles control changes and keyboard shortcuts.
(function (root) {
  'use strict';
  const M5 = root.M5;
  function initEvents(doc, state, adapter, view) {
    const get = id => doc.getElementById(id), cleanups = [];
    function on(element, event, handler) {
      if (!element) return;
      const guarded = action => {
        const layout = ['sidebarBtn', 'restoreSidebarBtn', 'focusBtn', 'exitFocusBtn'].some(id => get(id) === element);
        if (state.recording && element !== doc && !layout) return;
        handler(action);
      };
      element.addEventListener(event, guarded);
      cleanups.push(() => element.removeEventListener(event, guarded));
    }
    function feedback(result) { get('statusMessage').textContent = result.ok ? '' : result.error; }
    function toggleSidebar() { state.sidebarOpen = !state.sidebarOpen; view.renderLayout(); }
    function toggleFocus() { state.focus = !state.focus; view.renderLayout(); }
    function togglePlayback() { if (adapter.getPlayback().running) adapter.pause(); else adapter.play(); }
    function reset() { adapter.reset(); view.resetPlayback(); adapter.requestRender(); }
    on(get('sidebarBtn'), 'click', toggleSidebar); on(get('restoreSidebarBtn'), 'click', toggleSidebar);
    on(get('focusBtn'), 'click', toggleFocus); on(get('exitFocusBtn'), 'click', toggleFocus);
    on(get('startBtn'), 'click', () => adapter.play()); on(get('stopBtn'), 'click', () => adapter.pause());
    on(get('resetBtn'), 'click', reset);
    function word(event) {
      if (event.isComposing) return;
      const result = M5.applyWord(state, event.target.value, adapter);
      view.renderWord(result); view.renderPreview();
      if (result.ok) view.renderColours();
    }
    on(get('wordInput'), 'input', word); on(get('wordInput'), 'compositionend', word);
    on(get('blockSizeSlider'), 'input', event => {
      feedback(M5.applyBlockSize(state, Number(event.target.value), adapter)); view.renderPreview();
    });
    on(get('letterSpacingSlider'), 'input', event => {
      feedback(M5.applyLetterSpacing(state, Number(event.target.value), adapter)); view.renderPreview();
    });
    on(get('depthSlider'), 'input', event => {
      feedback(M5.applyDepth(state, Number(event.target.value), adapter)); view.renderPreview();
    });
    on(get('speedSlider'), 'input', event => {
      const speed = Number(event.target.value); adapter.setSpeed(speed); state.speed = speed; view.renderPreview();
    });
    // Edit a copy so an upload failure keeps the previous colour settings.
    function colourEdit(edit, rebuild = true) {
      const next = JSON.parse(JSON.stringify(state.colours)); edit(next);
      const result = M5.applyColourSettings(state, next, adapter); feedback(result);
      get('paletteSelect').value = state.colours[state.colours.mode].palette;
      if (rebuild || !result.ok) view.renderColours();
    }
    on(get('colourMode'), 'change', event => colourEdit(next => { next.mode = event.target.value; }));
    on(get('paletteSelect'), 'change', event => colourEdit(next => {
      const value = next[next.mode], name = event.target.value, palette = M5.palettes[name];
      value.palette = name;
      if (!palette) return;
      if (next.mode === 'single') value.colour = palette[0];
      else if (next.mode === 'faces') { value.front = palette[0]; value.side = palette[1]; }
      else { value.colours = palette.slice(0, value.colours.length); if (next.mode === 'gradient') value.side = palette[2]; }
    }));
    on(get('colourFields'), 'input', event => {
      const target = event.target;
      if (target.dataset.field) colourEdit(next => {
        const value = next[next.mode];
        if (target.dataset.field === 'colours') value.colours[Number(target.dataset.index)] = target.value;
        else value[target.dataset.field] = target.value;
        value.palette = 'Custom';
      }, false);
      else if (target.id === 'gradientAngle') {
        colourEdit(next => { next.gradient.angle = Number(target.value); next.gradient.direction = 'Custom'; }, false);
        get('angleValue').textContent = state.colours.gradient.angle + ' degrees';
        get('directionPreset').value = state.colours.gradient.direction;
      }
    });
    on(get('colourFields'), 'change', event => {
      const id = event.target.id, value = event.target.value;
      if (id === 'directionPreset') colourEdit(next => {
        next.gradient.direction = value;
        const angle = { Horizontal: 0, Vertical: 90, Diagonal: 45 }[value];
        if (angle !== undefined) next.gradient.angle = angle;
      });
      if (id === 'gradientCoverage') colourEdit(next => { next.gradient.coverage = value; });
      if (id === 'gradientSurface') colourEdit(next => { next.gradient.surface = value; });
    });
    on(get('colourFields'), 'click', event => {
      const action = event.target.dataset.action;
      if (!action) return;
      colourEdit(next => {
        const value = next.gradient;
        if (action === 'add' && value.colours.length < 4) value.colours.push(value.colours[value.colours.length - 1]);
        if (action === 'remove' && value.colours.length > 2) value.colours.pop();
        value.palette = 'Custom';
      });
    });
    function graphics(action) {
      try { action(); adapter.requestRender(); feedback({ ok: true }); }
      catch (error) { feedback({ ok: false, error: error.message }); }
      view.renderGraphics();
    }
    on(get('projectionSelect'), 'change', event => graphics(() => {
      adapter.setProjection(event.target.value); state.projection = event.target.value;
    }));
    on(get('lightPreset'), 'change', event => graphics(() => {
      const name = event.target.value, angles = { 'Top Left': [-45,35], 'Top Right': [45,35], Front: [0,0], Back: [180,0], Above: [0,90] }[name];
      const next = angles ? { ...state.light, horizontal: angles[0], vertical: angles[1] } : { ...state.light };
      adapter.setLight(next); state.light = next; state.lightPreset = name;
    }));
    ['horizontal', 'vertical', 'intensity'].forEach(key => {
      on(get('light' + key[0].toUpperCase() + key.slice(1)), 'input', event => graphics(() => {
        const next = { ...state.light, [key]: Number(event.target.value) };
        adapter.setLight(next); state.light = next;
        if (key !== 'intensity') state.lightPreset = 'Custom';
      }));
    });
    function material(preset, changes = {}) { feedback(M5.applyMaterial(state, preset, changes, adapter)); view.renderGraphics(); }
    on(get('materialPreset'), 'change', event => material(event.target.value));
    on(get('shininessSlider'), 'input', event => material(state.material, { shininess: Number(event.target.value) }));
    on(get('specularSlider'), 'input', event => material(state.material, { specularIntensity: Number(event.target.value) }));
    on(get('materialReset'), 'click', () => material(state.material, state.materialDefaults[state.material]));
    // Ignore shortcuts while typing or using a focused control.
    on(doc, 'keydown', event => {
      if (event.isComposing || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName))) return;
      const key = event.key.toLowerCase();
      if ((key === ' ' || key === 'r') && state.recording) return;
      if (key === ' ') { event.preventDefault(); togglePlayback(); }
      else if (key === 'r') reset();
      else if (key === 'f') toggleFocus();
      else if (key === 'h') toggleSidebar();
    });
    return () => cleanups.splice(0).forEach(cleanup => cleanup());
  }
  M5.initEvents = initEvents;
})(window);

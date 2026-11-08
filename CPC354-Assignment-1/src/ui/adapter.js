// adapter.js - Connects UI actions to geometry, rendering and animation functions.
// Supports real implementations and test mocks.
(function (root) {
  'use strict';
  // Report an error if a requested function is unavailable.
  function createAdapter(bindings) {
    const has = name => typeof bindings[name] === 'function';
    const call = (name, ...args) => {
      if (!has(name)) throw new Error(name + ' is unavailable.');
      return bindings[name](...args);
    };
    // Refresh listeners after playback changes or animation frames.
    const listeners = new Set();
    const notify = () => listeners.forEach(listener => listener(adapter.getPlayback()));
    const adapter = {
      // List the optional features provided by the supplied functions.
      capabilities: Object.freeze({
        renderer: !!bindings.realRenderer,
        projection: has('setProjection'), lighting: has('setLight'),
        material: has('setMaterial'),
        captureResize: has('beginCaptureSize'), introBoundary: has('isIntroComplete')
      }),
      buildGeometry: options => call('buildWordGeometry', options),
      // Replace the mesh or update colours without rebuilding it.
      // The renderer must preserve the old mesh if an upload fails.
      replaceGeometry: (mesh, rgba) => call('replaceGeometry', mesh, rgba),
      updateColors: rgba => call('updateColors', rgba),
      requestRender: () => call('requestRender'),
      play: () => { call('startAnimation'); notify(); },
      pause: () => { call('stopAnimation'); notify(); },
      reset: () => { call('resetAnimation'); notify(); },
      // Converts the UI speed multiplier to raw playback units: 1x = 60.
      setSpeed: multiplier => {
        if (!Number.isFinite(multiplier) || multiplier <= 0) throw new RangeError('Speed must be positive.');
        call('setAnimationSpeed', multiplier * 60); notify();
      },
      // Returns running status, elapsed seconds, phase name and intro status.
      // A null introComplete value indicates an unknown intro boundary.
      getPlayback: () => {
        const state = call('getAnimationState');
        return { running: state.running, elapsedSeconds: state.elapsed,
          phaseName: state.transform && state.transform.phaseName || '',
          introComplete: has('isIntroComplete') ? bindings.isIntroComplete() : null };
      },
      setProjection: mode => call('setProjection', mode),
      // Resize the preview when a resize function is available.
      resizePreview: () => has('resizePreview') ? bindings.resizePreview() : undefined,
      setLight: value => call('setLight', value),
      setMaterial: value => call('setMaterial', value),
      beginCaptureSize: (width, height) => call('beginCaptureSize', width, height),
      // Return a function that removes this playback listener.
      subscribePlayback: listener => { listeners.add(listener); return () => listeners.delete(listener); },
      dispose: () => {
        if (has('setFrameCallback')) bindings.setFrameCallback(null);
        listeners.clear();
      }
    };
    if (has('setFrameCallback')) bindings.setFrameCallback(notify);
    return adapter;
  }
  // Make the adapter available to browser code and Node tests.
  if (typeof module !== 'undefined' && module.exports) module.exports = { createAdapter };
  root.M5 = Object.assign(root.M5 || {}, { createAdapter });
})(typeof window === 'undefined' ? globalThis : window);

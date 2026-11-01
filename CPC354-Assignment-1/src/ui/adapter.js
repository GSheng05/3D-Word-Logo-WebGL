// =============================================================
// adapter.js - M5 interface to geometry, rendering and playback
// -------------------------------------------------------------
// Routes UI operations to supplied geometry, rendering and playback functions.
// The supplied bindings may be mock or real implementations.
// Missing optional features are reported through capabilities.
//
// Public API: M5.createAdapter(bindings) -> adapter
// Depends on: supplied bindings; no DOM or WebGL calls in this file.
// =============================================================
(function (root) {
  'use strict';
  // Creates an adapter from named operation bindings. Calling a missing
  // required function throws an error describing the unavailable operation.
  function createAdapter(bindings) {
    const has = name => typeof bindings[name] === 'function';
    const call = (name, ...args) => {
      if (!has(name)) throw new Error(name + ' is unavailable.');
      return bindings[name](...args);
    };
    // Notifies subscribers after playback actions made through this adapter.
    // Engine-driven phase changes do not emit notifications here.
    const listeners = new Set();
    const notify = () => listeners.forEach(listener => listener(adapter.getPlayback()));
    const adapter = {
      // Function presence indicates available hooks, not verified visual
      // output. Mocks deliberately leave advanced renderer hooks absent.
      capabilities: Object.freeze({
        renderer: !!bindings.realRenderer,
        projection: has('setProjection'), lighting: has('setLight'),
        material: has('setMaterial'), shadowOpacity: has('setShadow'),
        shadowSoftness: !!bindings.shadowSoftness,
        captureResize: has('beginCaptureSize'), introBoundary: has('isIntroComplete')
      }),
      buildGeometry: options => call('buildWordGeometry', options),
      // The renderer binding must keep the old mesh if replacement fails.
      // Colour-only edits use updateColors without rebuilding geometry.
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
      // Layout changes are allowed in the mock preview without a camera.
      resizePreview: () => has('resizePreview') ? bindings.resizePreview() : undefined,
      setLight: value => call('setLight', value),
      setMaterial: value => call('setMaterial', value),
      setShadow: value => call('setShadow', value),
      beginCaptureSize: (width, height) => call('beginCaptureSize', width, height),
      // Return cleanup so a disposed UI stops receiving notifications.
      subscribePlayback: listener => { listeners.add(listener); return () => listeners.delete(listener); }
    };
    return adapter;
  }
  // Exports functions for Node tests and the browser's M5 namespace.
  // The closure keeps internal helpers out of the global scope.
  if (typeof module !== 'undefined' && module.exports) module.exports = { createAdapter };
  root.M5 = Object.assign(root.M5 || {}, { createAdapter });
})(typeof window === 'undefined' ? globalThis : window);

// main.js - Single startup path connecting geometry, WebGL, animation and Studio controls.
(function () {
  'use strict';
  function start() {
    const canvas = document.getElementById('logo-canvas');
    const status = document.getElementById('statusMessage');
    let renderer, adapter, view, disposeResize, disposeEvents, recording;
    const state = M5.createState({ light: M2.lighting.defaults, materials: M2.lighting.materials });
    function report(error) {
      stopAnimation();
      if (recording) recording.fail(error);
      status.textContent = error.message;
      document.getElementById('rendererStatus').textContent = 'Rendering unavailable';
      if (view) view.renderPlayback();
    }
    // Refit before evaluating the pose so projection/layout changes redraw correctly while paused.
    function render() {
      if (!state.mesh) return;
      try {
        const fit = updateFit(state.mesh.bounds);
        updatePose(getAnimationState().elapsed);
        renderer.draw({ model: mult(getAnimationModelMatrix(), scale(fit, fit, fit)),
          view: getViewMatrix(), projection: getProjectionMatrix(getCanvasAspect()) });
      } catch (error) { report(error); }
    }
    function dispose() {
      if (recording) recording.dispose();
      stopAnimation(); setRenderCallback(null);
      if (disposeEvents) disposeEvents();
      if (view) view.dispose();
      if (adapter) adapter.dispose();
      if (disposeResize) disposeResize();
      if (renderer) renderer.dispose();
    }
    try {
      renderer = M2.webgl.initialize(canvas);
      setRenderCallback(render);
      disposeResize = initResize(canvas, renderer.gl, requestRender);
      adapter = M5.createAdapter({ realRenderer: true, buildWordGeometry,
        replaceGeometry: renderer.replaceGeometry, updateColors: renderer.updateColors,
        requestRender, startAnimation, stopAnimation, resetAnimation, setAnimationSpeed,
        getAnimationState, setFrameCallback, resizePreview, setProjection,
        setLight: renderer.setLight, setMaterial: renderer.setMaterial,
        // A recorder retains this cleanup and invokes it on stop, cancellation or failure.
        beginCaptureSize(width, height) {
          beginCaptureSize(width, height);
          let ended = false;
          return () => { if (!ended) { ended = true; endCaptureSize(); } };
        }
      });
      const initial = M5.applyWord(state, state.draftWord, adapter);
      if (!initial.ok) throw new Error(initial.error);
      view = M5.initControls(document, state, adapter);
      disposeEvents = M5.initEvents(document, state, adapter, view);
      recording = M5.initRecording(document, state, adapter, view, canvas, active => {
        renderer.setClearColour(active ? [0.035, 0.047, 0.08, 1] : [0, 0, 0, 0]);
      });
      // Expose the active session for recorder integration and diagnostics.
      M5.app = { state, adapter, recording, dispose };
      window.addEventListener('beforeunload', dispose, { once: true });
      canvas.addEventListener('webglcontextlost', () => report(new Error('WebGL context lost. Reload the page to restore the preview.')));
    } catch (error) { report(error); dispose(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();

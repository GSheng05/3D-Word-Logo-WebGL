// =============================================================
// state.js - M5 session settings and safe logo updates
// -------------------------------------------------------------
// Word/depth edit -> build candidate mesh -> make colours -> upload
// -> publish successful settings -> request a render.
// An invalid draft stays in the input while the last valid logo remains.
//
// Public API: M5.createState(), applyWord(), applyDepth(),
//             applyColour(), coloursFor()
// Depends on: the adapter passed to each update function.
// Settings live in memory only; refreshing starts a new session.
// =============================================================
(function (root) {
  'use strict';
  // draftWord is what the user is editing; renderedWord/mesh describe
  // the last successful replacement. Layout flags are independent so
  // leaving Focus Mode restores the existing sidebar preference.
  function createState() {
    return { draftWord: 'USM', renderedWord: '', depth: 1, colour: '#80a8ff', mesh: null,
      speed: 1, sidebarOpen: true, focus: false, recording: false };
  }
  // Convert #RRGGBB to normalized RGBA (alpha = 1). M1 positions have
  // positions contain three numbers per vertex; colours contain four.
  // Assigns the same opaque colour to every vertex.
  function coloursFor(mesh, colour) {
    const match = /^#([0-9a-f]{6})$/i.exec(colour);
    if (!match) throw new Error('Choose a valid colour.');
    const rgb = [0, 2, 4].map(i => parseInt(match[1].slice(i, i + 2), 16) / 255);
    const result = new Float32Array(mesh.positions.length / 3 * 4);
    for (let i = 0; i < result.length; i += 4) result.set([...rgb, 1], i);
    return result;
  }
  // Build and upload before publishing the new word/depth. Construction
  // and upload errors return {ok:false,error} for UI feedback. Upload
  // rollback is the renderer binding's responsibility; this function
  // cannot undo a renderer that partially replaces its buffers.
  function replace(state, word, depth, adapter) {
    try {
      const mesh = adapter.buildGeometry({ word, extrusionDepth: depth });
      const colors = coloursFor(mesh, state.colour);
      adapter.replaceGeometry(mesh, colors);
      state.mesh = mesh; state.renderedWord = mesh.word; state.depth = depth;
      // A paused logo must also show edits; no playback reset is needed.
      adapter.requestRender();
      return { ok: true };
    } catch (error) { return { ok: false, error: error.message }; }
  }
  // Keep raw draft input even when geometry validation rejects it.
  function applyWord(state, value, adapter) { state.draftWord = value; return replace(state, value, state.depth, adapter); }
  // Depth edits use the rendered word, never a possibly invalid draft.
  function applyDepth(state, depth, adapter) {
    if (!Number.isFinite(depth) || depth <= 0) return { ok: false, error: 'Depth must be positive.' };
    return replace(state, state.renderedWord, depth, adapter);
  }
  // Reuse the current mesh and update only its colour data.
  function applyColour(state, colour, adapter) {
    try { const rgba = coloursFor(state.mesh, colour); adapter.updateColors(rgba); state.colour = colour; adapter.requestRender(); return { ok: true }; }
    catch (error) { return { ok: false, error: error.message }; }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createState, applyWord, applyDepth, applyColour, coloursFor };
  root.M5 = Object.assign(root.M5 || {}, { createState, applyWord, applyDepth, applyColour, coloursFor });
})(typeof window === 'undefined' ? globalThis : window);

// state.js - Stores session settings and applies validated logo changes.
// Settings reset when the page reloads.
(function (root) {
  'use strict';
  const colourApi = typeof module !== 'undefined' && module.exports ? require('./colors.js') : root.M5;
  // Keep draft input separate from the last valid logo.
  // Store sidebar visibility independently from Focus Mode.
  function createState(config = {}) {
    return { draftWord: 'USM', renderedWord: '', depth: 1, blockSize: 1, letterSpacing: 1, colour: '#80a8ff', mesh: null,
      speed: 1, sidebarOpen: true, focus: false, recording: false,
      colours: colourApi.createColourSettings(), projection: 'perspective',
      light: { ...(config.light || { horizontal: -45, vertical: 35, intensity: 1 }) },
      lightPreset: 'Top Left', material: 'Matte',
      materialDefaults: JSON.parse(JSON.stringify(config.materials || {})),
      materials: JSON.parse(JSON.stringify(config.materials || {})) };
  }
  // Convert a hex colour to RGBA values (0-1) for every vertex.
  function coloursFor(mesh, colour) {
    const match = /^#([0-9a-f]{6})$/i.exec(colour);
    if (!match) throw new Error('Choose a valid colour.');
    const rgb = [0, 2, 4].map(i => parseInt(match[1].slice(i, i + 2), 16) / 255);
    const result = new Float32Array(mesh.positions.length / 3 * 4);
    for (let i = 0; i < result.length; i += 4) result.set([...rgb, 1], i);
    return result;
  }
  // Build and upload the mesh before saving the new geometry settings.
  // Return errors to the UI; the renderer handles failed uploads.
  function replace(state, word, depth, adapter, blockSize = state.blockSize, letterSpacing = state.letterSpacing) {
    try {
      const mesh = adapter.buildGeometry({ word, extrusionDepth: depth, blockSize, letterSpacing });
      const colors = colourApi.makeColors(mesh, state.colours);
      adapter.replaceGeometry(mesh, colors);
      state.mesh = mesh; state.renderedWord = mesh.word; state.depth = depth;
      state.blockSize = blockSize; state.letterSpacing = letterSpacing;
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
  function applyBlockSize(state, blockSize, adapter) {
    if (!Number.isFinite(blockSize) || blockSize <= 0) return { ok: false, error: 'Block size must be positive.' };
    return replace(state, state.renderedWord, state.depth, adapter, blockSize);
  }
  function applyLetterSpacing(state, letterSpacing, adapter) {
    if (!Number.isFinite(letterSpacing) || letterSpacing < 0) return { ok: false, error: 'Letter spacing must be non-negative.' };
    return replace(state, state.renderedWord, state.depth, adapter, state.blockSize, letterSpacing);
  }
  // Reuse the current mesh and update only its colour data.
  function applyColour(state, colour, adapter) {
    const next = JSON.parse(JSON.stringify(state.colours));
    next.single.colour = colour;
    next.single.palette = 'Custom';
    return applyColourSettings(state, next, adapter);
  }

  // Save colour settings after the buffer upload succeeds.
  function applyColourSettings(state, next, adapter) {
    try {
      const rgba = colourApi.makeColors(state.mesh, next);
      adapter.updateColors(rgba);
      state.colours = next;
      state.colour = next.single.colour;
      adapter.requestRender();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  // Restore this material's saved adjustments when selecting its preset.
  function applyMaterial(state, preset, changes, adapter) {
    try {
      const saved = state.materials[preset];
      if (!saved) throw new RangeError('Unknown material preset.');
      const next = { ...saved, ...changes };
      adapter.setMaterial({ preset, shininess: next.shininess, specularIntensity: next.specularIntensity });
      state.materials[preset] = next;
      state.material = preset;
      adapter.requestRender();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  const api = { createState, applyWord, applyDepth, applyBlockSize, applyLetterSpacing, applyColour, coloursFor, applyColourSettings, applyMaterial };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.M5 = Object.assign(root.M5 || {}, api);
})(typeof window === 'undefined' ? globalThis : window);

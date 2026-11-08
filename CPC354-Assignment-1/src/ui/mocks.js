// mocks.js - Supplies simple geometry and playback data for UI tests.
// Test code advances time manually; these functions do not render a real logo.
(function (root) {
  'use strict';
  // Trim outer spaces and accept 2-4 letters (A-Z), converted to uppercase.
  function validateWord(input) {
    if (typeof input !== 'string') throw new TypeError('Word must be text.');
    const word = input.trim();
    if (!/^[a-zA-Z]+$/.test(word)) throw new RangeError('Use letters A–Z only, without spaces or punctuation.');
    if (word.length < 2 || word.length > 4) throw new RangeError('Enter a word containing 2 to 4 letters.');
    return word.toUpperCase();
  }
  // Generates triangle data with per-vertex face and character identifiers.
  function makeFixture(input, depth) {
    const word = validateWord(input);
    const positions = [], normals = [], faceIds = [], letterIds = [], indices = [];
    // Give repeated letters separate IDs. Face IDs 0-5 are test data only.
    for (let i = 0; i < word.length; i++) {
      const x = i * 2 - (word.length - 1);
      for (let face = 0; face < 6; face++) {
        const base = positions.length / 3;
        positions.push(x, 0, face === 0 ? depth / 2 : -depth / 2,
          x + 1, 0, face === 0 ? depth / 2 : -depth / 2,
          x, 1, face === 0 ? depth / 2 : -depth / 2);
        normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1);
        faceIds.push(face, face, face); letterIds.push(i, i, i);
        indices.push(base, base + 1, base + 2);
      }
    }
    const min = [-(word.length - 1), 0, -depth / 2];
    const max = [word.length, 1, depth / 2];
    // Return typed vertex arrays and whole-word bounds, without per-letter bounds.
    return { positions: new Float32Array(positions), normals: new Float32Array(normals),
      indices: new Uint16Array(indices), faceIds: new Uint8Array(faceIds),
      letterIds: new Uint8Array(letterIds), word,
      bounds: { min, max, size: max.map((v, i) => v - min[i]), center: max.map((v, i) => (v + min[i]) / 2) },
      parameters: { word, extrusionDepth: depth } };
  }
  // Keep test state separate for each instance; pass it to onRender when requested.
  function createMockBindings(onRender = () => {}) {
    let mesh = null, colour = null, buildCount = 0, rawSpeed = 60, fail = false;
    const state = { running: false, elapsed: 0, transform: { phaseName: 'Mock preview' } };
    return {
      buildWordGeometry(options) { buildCount++; return makeFixture(options.word, options.extrusionDepth); },
      // Fail before assignment to simulate a safe upload failure.
      replaceGeometry(next, rgba) {
        if (fail) { fail = false; throw new Error('Mock upload failed.'); }
        mesh = next; colour = rgba;
      },
      updateColors(rgba) { colour = rgba; },
      requestRender() { onRender({ mesh, colour, state }); },
      startAnimation() { state.running = true; }, stopAnimation() { state.running = false; },
      resetAnimation() { state.running = false; state.elapsed = 0; },
      setAnimationSpeed(value) { rawSpeed = value; }, getAnimationState() { return state; },
      // Advance test time manually without running an animation loop.
      advance(seconds) { if (state.running) state.elapsed += seconds * rawSpeed / 60; },
      // Test hooks expose call counts and trigger one failed replacement.
      inspect() { return { mesh, colour, buildCount, rawSpeed }; },
      failNextReplacement() { fail = true; }
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createMockBindings, makeFixture, validateWord };
  root.M5 = Object.assign(root.M5 || {}, { createMockBindings, makeFixture, validateWord });
})(typeof window === 'undefined' ? globalThis : window);

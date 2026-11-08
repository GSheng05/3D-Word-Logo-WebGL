// =============================================================
// colors.js - Per-vertex RGBA assignment in object-local coordinates
// -------------------------------------------------------------
// Single, front/side, character and gradient modes share the same
// vertex order as geometry.positions. Each vertex receives four floats.
// Public API: createColourSettings(), makeColors(mesh, settings).
// =============================================================
(function (root) {
  'use strict';

  const palettes = Object.freeze({
    Ocean: ['#80a8ff', '#39d6c5', '#265aab', '#e1f7ff'],
    Sunset: ['#ff775e', '#ffc857', '#a8499b', '#543c91'],
    Forest: ['#84c98b', '#2b7b63', '#c2db91', '#e8edc7']
  });

  // Every mode retains its own values when another mode is selected.
  function createColourSettings() {
    return {
      mode: 'single',
      single: { colour: '#80a8ff', palette: 'Custom' },
      faces: { front: '#80a8ff', side: '#265aab', palette: 'Ocean' },
      letters: { colours: [...palettes.Ocean], palette: 'Ocean' },
      gradient: {
        colours: ['#80a8ff', '#39d6c5'], angle: 0, direction: 'Horizontal',
        coverage: 'word', surface: 'all', side: '#265aab', palette: 'Ocean'
      }
    };
  }

  function parseColour(hex) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new TypeError('Use a six-digit hex colour.');
    return [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  }

  // Calculate occupied bounds by character position when metadata is absent.
  // Supplied geometry and its metadata are never changed by this calculation.
  function letterBounds(mesh) {
    if (mesh.letterBounds) return mesh.letterBounds;
    const bounds = [];
    for (let vertex = 0; vertex < mesh.letterIds.length; vertex++) {
      const id = mesh.letterIds[vertex];
      if (!bounds[id]) bounds[id] = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
      for (let axis = 0; axis < 3; axis++) {
        const value = mesh.positions[vertex * 3 + axis];
        bounds[id].min[axis] = Math.min(bounds[id].min[axis], value);
        bounds[id].max[axis] = Math.max(bounds[id].max[axis], value);
      }
    }
    return bounds;
  }

  // Project XY bounding corners onto the gradient axis. Snapping tiny
  // trigonometric values keeps cardinal directions and endpoints exact.
  function projectionRange(bounds, dx, dy) {
    const xs = [bounds.min[0] * dx, bounds.max[0] * dx];
    const ys = [bounds.min[1] * dy, bounds.max[1] * dy];
    return [Math.min(...xs) + Math.min(...ys), Math.max(...xs) + Math.max(...ys)];
  }

  function makeColors(mesh, settings) {
    const count = mesh.positions.length / 3;
    if (!Number.isInteger(count) || mesh.faceIds.length !== count || mesh.letterIds.length !== count) {
      throw new RangeError('Colour metadata must match the mesh vertex count.');
    }
    if (!['single', 'faces', 'letters', 'gradient'].includes(settings.mode)) throw new RangeError('Unknown colour mode.');
    const current = settings[settings.mode];
    let colours;
    let ranges;
    let dx;
    let dy;
    let side;
    if (settings.mode === 'single') colours = [parseColour(current.colour)];
    if (settings.mode === 'faces') colours = [parseColour(current.front), parseColour(current.side)];
    if (settings.mode === 'letters') colours = current.colours.map(parseColour);
    if (settings.mode === 'gradient') {
      if (current.colours.length < 2 || current.colours.length > 4) throw new RangeError('Use 2 to 4 gradient colours.');
      if (!Number.isFinite(current.angle)) throw new RangeError('Gradient angle must be finite.');
      colours = current.colours.map(parseColour);
      side = parseColour(current.side);
      dx = Math.cos(current.angle * Math.PI / 180);
      dy = Math.sin(current.angle * Math.PI / 180);
      if (Math.abs(dx) < 1e-12) dx = 0;
      if (Math.abs(dy) < 1e-12) dy = 0;
      const bounds = current.coverage === 'letter' ? letterBounds(mesh) : [mesh.bounds];
      ranges = bounds.map(bound => projectionRange(bound, dx, dy));
    }

    const result = new Float32Array(count * 4);
    for (let vertex = 0; vertex < count; vertex++) {
      let rgb = colours[0];
      if (settings.mode === 'faces') rgb = colours[mesh.faceIds[vertex] === 0 ? 0 : 1];
      if (settings.mode === 'letters') rgb = colours[mesh.letterIds[vertex]];
      if (settings.mode === 'gradient') {
        const range = ranges[current.coverage === 'letter' ? mesh.letterIds[vertex] : 0];
        const position = mesh.positions[vertex * 3] * dx + mesh.positions[vertex * 3 + 1] * dy;
        const extent = range[1] - range[0];
        const t = extent > 1e-12 ? Math.max(0, Math.min(1, (position - range[0]) / extent)) : 0.5;
        const stop = t * (colours.length - 1);
        const lower = Math.min(Math.floor(stop), colours.length - 2);
        const fraction = stop - lower;
        rgb = colours[lower].map((value, channel) => value + (colours[lower + 1][channel] - value) * fraction);
        if (current.surface === 'front' && mesh.faceIds[vertex] !== 0) rgb = side;
      }
      if (!rgb || !rgb.every(Number.isFinite)) throw new RangeError('Invalid colour or letter metadata.');
      result.set([...rgb, 1], vertex * 4);
    }
    return result;
  }

  const api = { createColourSettings, makeColors, palettes };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.M5 = Object.assign(root.M5 || {}, api);
})(typeof window === 'undefined' ? globalThis : window);

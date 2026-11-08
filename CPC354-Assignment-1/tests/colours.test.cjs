const test = require('node:test');
const assert = require('node:assert/strict');
const { makeColors, createColourSettings } = require('../src/ui/colors.js');

function mesh() {
  return {
    positions: new Float32Array([-3, 0, 0, -1, 2, 0, 1, 0, 0, 3, 2, 0]),
    faceIds: new Uint8Array([0, 1, 0, 5]),
    letterIds: new Uint8Array([0, 0, 1, 1]),
    bounds: { min: [-3, 0, 0], max: [3, 2, 0] }
  };
}

test('front/side uses the same colour for back and side faces', () => {
  const settings = createColourSettings();
  settings.mode = 'faces';
  settings.faces = { front: '#ff0000', side: '#0000ff', palette: 'Custom' };
  assert.deepEqual(Array.from(makeColors(mesh(), settings)), [1,0,0,1, 0,0,1,1, 1,0,0,1, 0,0,1,1]);
});

test('per-letter colours follow character positions', () => {
  const settings = createColourSettings();
  settings.mode = 'letters';
  settings.letters.colours = ['#ff0000', '#00ff00', '#0000ff', '#ffffff'];
  const rgba = makeColors(mesh(), settings);
  assert.deepEqual(Array.from(rgba.slice(0, 8)), [1,0,0,1, 1,0,0,1]);
  assert.deepEqual(Array.from(rgba.slice(8)), [0,1,0,1, 0,1,0,1]);
});

test('local gradient angles, evenly spaced stops and front-only colouring', () => {
  const settings = createColourSettings();
  settings.mode = 'gradient';
  settings.gradient.colours = ['#000000', '#ffffff'];
  for (const angle of [0, 360, 90]) {
    settings.gradient.angle = angle;
    const rgba = makeColors(mesh(), settings);
    assert.equal(rgba[0], 0);
    assert.equal(rgba[12], 1);
  }
  settings.gradient.angle = 180;
  assert.equal(makeColors(mesh(), settings)[0], 1);
  settings.gradient.angle = 0;
  settings.gradient.colours = ['#000000', '#ff0000', '#00ff00', '#ffffff'];
  const rgba = makeColors(mesh(), settings);
  assert.deepEqual(Array.from(rgba.slice(4, 8)), [1,0,0,1]);
  settings.gradient.surface = 'front';
  settings.gradient.side = '#0000ff';
  assert.deepEqual(Array.from(makeColors(mesh(), settings).slice(4, 8)), [0,0,1,1]);
});

test('per-letter gradient derives separate occupied bounds without mutating geometry', () => {
  const geometry = mesh();
  const settings = createColourSettings();
  settings.mode = 'gradient';
  settings.gradient.coverage = 'letter';
  settings.gradient.colours = ['#000000', '#ffffff'];
  const rgba = makeColors(geometry, settings);
  assert.deepEqual(Array.from(rgba), [0,0,0,1, 1,1,1,1, 0,0,0,1, 1,1,1,1]);
  assert.equal(geometry.letterBounds, undefined);
});

test('zero projected extent gives midpoint colours and malformed colours fail', () => {
  const settings = createColourSettings();
  settings.mode = 'gradient';
  settings.gradient.colours = ['#000000', '#ffffff'];
  const geometry = mesh();
  geometry.positions.fill(0);
  geometry.bounds = { min: [0,0,0], max: [0,0,0] };
  assert.equal(makeColors(geometry, settings)[0], 0.5);
  settings.gradient.colours = ['invalid', '#ffffff'];
  assert.throws(() => makeColors(geometry, settings), /colour/i);
});

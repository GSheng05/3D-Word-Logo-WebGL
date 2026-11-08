const test = require('node:test');
const assert = require('node:assert/strict');
const { createAdapter } = require('../src/ui/adapter.js');
const { createMockBindings, makeFixture } = require('../src/ui/mocks.js');
const { createState, applyWord, applyDepth, applyColour } = require('../src/ui/state.js');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('adapter converts speed multipliers and pause preserves time', () => {
  const mock = createMockBindings();
  const adapter = createAdapter(mock);
  adapter.setSpeed(1);
  assert.equal(mock.inspect().rawSpeed, 60);
  adapter.play(); mock.advance(4); adapter.pause();
  assert.equal(adapter.getPlayback().elapsedSeconds, 4);
  assert.equal(adapter.getPlayback().running, false);
});

test('mock geometry mirrors typed arrays and identifies repeated letters', () => {
  const mesh = makeFixture('AA', 1);
  assert.ok(mesh.positions instanceof Float32Array);
  assert.ok(mesh.normals instanceof Float32Array);
  assert.ok(mesh.indices instanceof Uint16Array);
  assert.ok(mesh.faceIds instanceof Uint8Array);
  assert.ok(mesh.letterIds instanceof Uint8Array);
  assert.deepEqual([...new Set(mesh.letterIds)], [0, 1]);
  assert.equal(mesh.faceIds.length, mesh.positions.length / 3);
  assert.equal(mesh.letterBounds, undefined);
});

test('adapter identifies unavailable advanced capabilities', () => {
  const adapter = createAdapter(createMockBindings());
  assert.equal(adapter.capabilities.renderer, false);
  assert.equal(adapter.capabilities.projection, false);
  assert.equal(adapter.capabilities.material, false);
  assert.equal(adapter.capabilities.captureResize, false);
  assert.throws(() => adapter.setProjection('perspective'), /unavailable/i);
});

test('colour updates do not rebuild geometry', () => {
  const mock = createMockBindings();
  const adapter = createAdapter(mock);
  const state = createState();
  applyWord(state, 'TV', adapter);
  const before = mock.inspect().buildCount;
  applyColour(state, '#112233', adapter);
  assert.equal(mock.inspect().buildCount, before);
  assert.ok(Math.abs(mock.inspect().colour[0] - 17 / 255) < 1e-6);
});

test('invalid input and failed mesh replacement preserve last valid logo', () => {
  const mock = createMockBindings();
  const adapter = createAdapter(mock);
  const state = createState();
  assert.equal(applyWord(state, 'tv', adapter).ok, true);
  for (const text of ['', 'A', 'ABCDE', 'A1B', 'A B', 'éa']) {
    assert.equal(applyWord(state, text, adapter).ok, false);
    assert.equal(state.renderedWord, 'TV');
    assert.equal(mock.inspect().mesh.word, 'TV');
  }
  mock.failNextReplacement();
  assert.equal(applyWord(state, 'USM', adapter).ok, false);
  assert.equal(state.renderedWord, 'TV');
  assert.equal(mock.inspect().mesh.word, 'TV');
});

test('depth changes preserve playback and rollback if replacement fails', () => {
  const mock = createMockBindings(); const adapter = createAdapter(mock);
  const state = createState(); applyWord(state, 'TV', adapter);
  adapter.play(); mock.advance(3);
  assert.equal(applyDepth(state, 2, adapter).ok, true);
  assert.equal(adapter.getPlayback().elapsedSeconds, 3);
  mock.failNextReplacement();
  assert.equal(applyDepth(state, 3, adapter).ok, false);
  assert.equal(state.depth, 2);
});

test('keyboard shortcuts avoid editing controls and listeners are removable', () => {
  class Target {
    constructor(tagName = 'DIV') { this.tagName = tagName; this.listeners = {}; this.value = ''; }
    addEventListener(type, fn) { (this.listeners[type] ||= new Set()).add(fn); }
    removeEventListener(type, fn) { this.listeners[type]?.delete(fn); }
    emit(type, properties = {}) {
      const event = { target: this, key: '', preventDefault() { this.prevented = true; }, ...properties };
      for (const fn of this.listeners[type] || []) fn(event);
      return event;
    }
  }
  const ids = ['sidebarBtn', 'restoreSidebarBtn', 'focusBtn', 'exitFocusBtn', 'startBtn', 'stopBtn', 'resetBtn', 'wordInput', 'depthSlider', 'colourInput', 'speedSlider', 'statusMessage'];
  const elements = Object.fromEntries(ids.map(id => [id, new Target()]));
  const doc = new Target(); doc.readyState = 'loading'; doc.getElementById = id => elements[id];
  const state = createState(), mock = createMockBindings(), adapter = createAdapter(mock);
  const view = { renderLayout() {}, renderPreview() {}, renderWord() {}, resetPlayback() {} };
  const window = { M5: { applyWord, applyDepth, applyColour } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/ui/events.js'), 'utf8'), { window, document: doc });
  const dispose = window.M5.initEvents(doc, state, adapter, view);
  doc.emit('keydown', { key: 'h', target: new Target('INPUT') });
  assert.equal(state.sidebarOpen, true);
  doc.emit('keydown', { key: 'h', target: new Target('DIV') });
  assert.equal(state.sidebarOpen, false);
  doc.emit('keydown', { key: 'f', target: new Target('DIV'), ctrlKey: true });
  assert.equal(state.focus, false);
  doc.emit('keydown', { key: ' ', target: new Target('DIV') });
  assert.equal(adapter.getPlayback().running, true);
  dispose();
  doc.emit('keydown', { key: ' ', target: new Target('DIV') });
  assert.equal(adapter.getPlayback().running, true);
});

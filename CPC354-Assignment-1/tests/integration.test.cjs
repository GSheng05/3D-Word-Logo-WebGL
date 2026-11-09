const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.join(__dirname, '..');

// Execute the page's real script order with a recording GL boundary and minimal DOM.
// This verifies integration contracts; it does not substitute for a GPU/browser visual test.
function boot(environment = {}) {
  const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
  const nodes = new Map();
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, { value: '', textContent: '', dataset: {}, listeners: {},
      classList: { toggle() {} }, setAttribute() {}, querySelector() { return node(id + '-span'); },
      addEventListener(type, fn) { this.listeners[type] = fn; }, removeEventListener(type) { delete this.listeners[type]; } });
    return nodes.get(id);
  }
  [...html.matchAll(/id="([^"]+)"/g)].forEach(match => node(match[1]));
  let draws = 0, nextFrame = 0;
  const frames = new Map();
  const gl = new Proxy({ NO_ERROR: 0, getError: () => 0, isContextLost: () => false,
    getShaderParameter: () => true, getProgramParameter: () => true,
    createShader: () => ({}), createProgram: () => ({}), createBuffer: () => ({}),
    getAttribLocation: () => 0, getUniformLocation: () => ({}), getParameter: () => null,
    drawElements: () => draws++ }, { get(target, key) {
      if (key in target) return target[key];
      return /^[A-Z_]+$/.test(key) ? key : () => {};
    } });
  const canvas = node('logo-canvas');
  Object.assign(canvas, { width: 300, height: 150, clientWidth: 800, clientHeight: 600, getContext: () => gl });
  const context = vm.createContext({ console, Float32Array, Uint16Array, Uint8Array,
    performance: { now: () => 0 }, devicePixelRatio: 1,
    requestAnimationFrame(fn) { frames.set(++nextFrame, fn); return nextFrame; },
    cancelAnimationFrame(id) { frames.delete(id); },
    ResizeObserver: class { observe() {} disconnect() {} }, addEventListener() {},
    document: { readyState: 'complete', getElementById: node, addEventListener() {}, removeEventListener() {} } });
  context.window = context;
  Object.assign(context, environment);
  for (const match of html.matchAll(/<script src="([^"]+)"/g)) vm.runInContext(fs.readFileSync(path.join(base, match[1]), 'utf8'), context, { filename: match[1] });
  assert.equal(node('statusMessage').textContent, '');
  assert.ok(context.M5.app, 'startup must produce an active session');
  return { context, node, canvas, frames, draws: () => draws };
}

test('real startup draws initial geometry and paused edits redraw without starting playback', () => {
  const { context: c, draws } = boot(), { state, adapter } = c.M5.app;
  assert.equal(state.renderedWord, 'USM'); assert.ok(draws() > 0);
  const before = draws();
  assert.equal(c.M5.applyWord(state, 'Abba', adapter).ok, true);
  assert.equal(state.renderedWord, 'ABBA');
  state.colours.mode = 'gradient'; state.colours.gradient.coverage = 'letter';
  assert.equal(c.M5.applyDepth(state, 2, adapter).ok, true);
  assert.ok(draws() > before); assert.equal(adapter.getPlayback().running, false);
  assert.equal(c.M5.applyWord(state, 'A B', adapter).ok, false);
  assert.equal(state.renderedWord, 'ABBA');
});

test('material adjustments survive preset changes and projection/light controls redraw', () => {
  const { context: c, node, draws } = boot(), { state, adapter } = c.M5.app;
  c.M5.applyMaterial(state, 'Glossy', { shininess: 77, specularIntensity: .25 }, adapter);
  c.M5.applyMaterial(state, 'Metallic', {}, adapter);
  c.M5.applyMaterial(state, 'Glossy', {}, adapter);
  assert.equal(state.materials.Glossy.shininess, 77);
  assert.equal(state.materials.Glossy.specularIntensity, .25);
  const before = draws();
  node('projectionSelect').listeners.change({ target: { value: 'orthographic' } });
  node('lightHorizontal').listeners.input({ target: { value: '60' } });
  assert.equal(state.projection, 'orthographic'); assert.equal(state.lightPreset, 'Custom');
  assert.equal(state.light.horizontal, 60); assert.ok(draws() > before);
});

test('capture fixes dimensions and cleanup restores current preview dimensions', () => {
  const { context: c, canvas } = boot(), adapter = c.M5.app.adapter;
  for (const [width, height] of [[1280,720], [1920,1080]]) {
    const end = adapter.beginCaptureSize(width, height);
    assert.equal(canvas.width, width); assert.equal(canvas.height, height);
    canvas.clientWidth = 900; adapter.resizePreview(); assert.equal(canvas.width, width);
    end(); end(); assert.equal(canvas.width, 900); assert.equal(canvas.height, 600);
  }
});

test('play/pause uses a single frame loop and layout redraw preserves elapsed time', () => {
  const { context: c, frames, node } = boot(), adapter = c.M5.app.adapter;
  adapter.play(); adapter.play(); assert.equal(frames.size, 1);
  const [id, callback] = [...frames][0]; frames.delete(id); callback(100);
  adapter.pause(); assert.equal(frames.size, 0);
  const elapsed = adapter.getPlayback().elapsedSeconds;
  node('focusBtn').listeners.click(); node('sidebarBtn').listeners.click();
  assert.equal(adapter.getPlayback().elapsedSeconds, elapsed);
  adapter.reset(); assert.equal(adapter.getPlayback().elapsedSeconds, 0);
});

test('recording UI locks scene and playback until finalization then offers download', () => {
  let encoder;
  class Recorder {
    static isTypeSupported(type) { return type === 'video/webm'; }
    constructor() { encoder = this; this.state = 'inactive'; this.mimeType = 'video/webm'; }
    start() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; }
  }
  // Install capture support before initialization using the same DOM canvas prototype hook.
  const { context: c, canvas, node } = boot();
  c.M5.app.recording.dispose();
  Object.assign(c, { MediaRecorder: Recorder, Blob, URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    setInterval: () => 1, clearInterval() {} });
  canvas.captureStream = () => ({ getTracks: () => [{ stop() {} }] });
  const { state, adapter } = c.M5.app;
  const view = c.M5.initControls(c.document, state, adapter);
  const recording = c.M5.initRecording(c.document, state, adapter, view, canvas, () => {});
  node('recordResolution').value = '1080';
  node('recordStart').listeners.click();
  assert.equal(state.recording, true); assert.equal(canvas.width, 1920);
  assert.equal(node('resetBtn').disabled, true);
  node('wordInput').listeners.input({ target: { value: 'AB' } });
  assert.equal(state.renderedWord, 'USM');
  node('stopBtn').listeners.click(); assert.equal(adapter.getPlayback().running, true);
  node('recordStop').listeners.click(); assert.equal(state.recording, true);
  encoder.ondataavailable({ data: new Blob(['video']) }); encoder.onstop();
  assert.equal(state.recording, false); assert.equal(canvas.width, 800);
  assert.equal(adapter.getPlayback().running, false);
  assert.equal(node('recordDownload').hidden, false);
  assert.equal(node('recordDownload').download, 'logo-1080p.webm');
  recording.dispose(); view.dispose();
});

test('geometry sliders rebuild the logo and preserve settings across word and depth edits', () => {
  const { context: c, node, draws } = boot(), { state, adapter } = c.M5.app;
  const before = draws();
  for (const [blockSize, letterSpacing] of [[0.2, 0], [2, 4], [1.3, 2.1]]) {
    node('blockSizeSlider').listeners.input({ target: { value: String(blockSize) } });
    node('letterSpacingSlider').listeners.input({ target: { value: String(letterSpacing) } });
    assert.equal(state.mesh.parameters.blockSize, blockSize);
    assert.equal(state.mesh.parameters.letterSpacing, letterSpacing);
    assert.equal(node('blockSizeValue').textContent, blockSize.toFixed(1));
    assert.equal(node('letterSpacingValue').textContent, letterSpacing.toFixed(1));
  }
  c.M5.applyWord(state, 'LOGO', adapter);
  c.M5.applyDepth(state, 2, adapter);
  assert.equal(state.mesh.parameters.blockSize, 1.3);
  assert.equal(state.mesh.parameters.letterSpacing, 2.1);
  c.M5.applyWord(state, '!', adapter);
  node('letterSpacingSlider').listeners.input({ target: { value: '0' } });
  assert.equal(state.mesh.word, 'LOGO');
  const mesh = state.mesh;
  const replaceGeometry = adapter.replaceGeometry;
  adapter.replaceGeometry = () => { throw new Error('Upload failed'); };
  node('blockSizeSlider').listeners.input({ target: { value: '2' } });
  assert.equal(state.mesh, mesh);
  assert.equal(state.blockSize, 1.3);
  assert.equal(node('blockSizeSlider').value, 1.3);
  adapter.replaceGeometry = replaceGeometry;
  assert.ok(draws() > before);
  assert.equal(adapter.getPlayback().running, false);
});

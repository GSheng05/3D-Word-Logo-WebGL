const test = require('node:test');
const assert = require('node:assert/strict');
const { createRecorder } = require('../src/ui/recorder.js');

function setup(failure) {
  const calls = [], updates = [], instances = [], timers = new Map(), revoked = [];
  let now = 0, nextUrl = 0;
  class Recorder {
    static isTypeSupported(type) { return type === 'video/webm;codecs=vp8'; }
    constructor(stream, options) {
      if (failure === 'constructor') throw new Error('Encoder unavailable');
      this.mimeType = options.mimeType; this.state = 'inactive'; instances.push(this);
    }
    start() { if (failure === 'start') throw new Error('Start failed'); this.state = 'recording'; }
    stop() { this.state = 'inactive'; calls.push('stop'); }
    finish(data = 'video') {
      this.ondataavailable({ data: new Blob([data]) }); this.onstop();
    }
  }
  const env = { MediaRecorder: Recorder, Blob, performance: { now: () => now },
    URL: { createObjectURL: () => 'blob:' + ++nextUrl, revokeObjectURL: url => revoked.push(url) },
    setInterval(fn) { timers.set(1, fn); return 1; }, clearInterval(id) { timers.delete(id); } };
  const canvas = { captureStream(rate) {
    assert.equal(rate, 30);
    if (failure === 'stream') throw new Error('Capture failed');
    return { getTracks: () => [{ stop() { calls.push('track-stop'); } }] };
  } };
  const adapter = {
    beginCaptureSize(w, h) { calls.push([w,h]); return () => calls.push('restore'); },
    pause() { calls.push('pause'); }, play() { calls.push('play'); }, reset() { calls.push('reset'); }, requestRender() {}
  };
  const recorder = createRecorder(canvas, adapter, { environment: env,
    setBackground: value => calls.push('background:' + value), onChange: info => updates.push(info) });
  return { recorder, instances, updates, calls, revoked, timers,
    tick(seconds) { now = seconds * 1000; [...timers.values()].forEach(fn => fn()); } };
}

test('stop waits for final data before restoring dimensions and creating download', () => {
  const s = setup(); s.recorder.start(720); s.recorder.start(1080);
  assert.equal(s.instances.length, 1); assert.deepEqual(s.calls[0], [1280,720]);
  s.recorder.stop(); s.recorder.stop();
  assert.equal(s.updates.at(-1).status, 'stopping'); assert.ok(!s.calls.includes('restore'));
  s.instances[0].finish();
  assert.equal(s.updates.at(-1).status, 'ready');
  assert.equal(s.updates.at(-1).result.filename, 'logo-720p.webm');
  assert.equal(s.updates.at(-1).result.size, 5);
  assert.equal(s.calls.filter(x => x === 'restore').length, 1);
  assert.ok(s.calls.includes('track-stop')); assert.equal(s.timers.size, 0);
});

test('cancel discards new chunks and preserves a previous download', () => {
  const s = setup(); s.recorder.start(720); s.recorder.stop(); s.instances[0].finish();
  const previous = s.updates.at(-1).result;
  s.recorder.start(1080); s.recorder.cancel(); s.instances[1].finish();
  assert.equal(s.updates.at(-1).status, 'cancelled'); assert.equal(s.updates.at(-1).result, previous);
  assert.deepEqual(s.calls.filter(Array.isArray), [[1280,720],[1920,1080]]);
});

for (const failure of ['stream','constructor','start']) test(failure + ' failure restores preview and allows retry', () => {
  const s = setup(failure); s.recorder.start(720);
  assert.equal(s.updates.at(-1).status, 'error'); assert.ok(s.calls.includes('restore'));
  assert.ok(s.calls.includes('background:false')); assert.equal(s.timers.size, 0);
  s.recorder.start(720); assert.equal(s.calls.filter(x => x === 'restore').length, 2);
});

test('encoder error releases resources immediately and ignores late stop events', () => {
  const s = setup(); s.recorder.start(720);
  s.instances[0].onerror({ error: new Error('Encoder failed') });
  assert.equal(s.updates.at(-1).status, 'error');
  s.instances[0].finish(); assert.equal(s.updates.at(-1).status, 'error');
  assert.equal(s.calls.filter(x => x === 'restore').length, 1);
});

test('successful replacement revokes previous URL and teardown releases latest URL', () => {
  const s = setup();
  for (let i = 0; i < 2; i++) { s.recorder.start(720); s.recorder.stop(); s.instances[i].finish(); }
  assert.deepEqual(s.revoked, ['blob:1']); s.recorder.dispose();
  assert.deepEqual(s.revoked, ['blob:1','blob:2']);
});

test('duration cap stops recording and empty output is reported', () => {
  const s = setup(); s.recorder.start(1080); s.tick(60);
  assert.equal(s.updates.at(-1).status, 'stopping');
  s.instances[0].finish(''); assert.equal(s.updates.at(-1).status, 'error');
  assert.equal(s.updates.at(-1).result, null);
});

test('teardown during recording drops late events and does not publish a download', () => {
  const s = setup(); s.recorder.start(720); s.recorder.dispose();
  const count = s.updates.length; s.instances[0].finish();
  assert.equal(s.updates.length, count); assert.ok(s.calls.includes('restore'));
  assert.equal(s.timers.size, 0);
});

test('unsupported browser is detected without touching capture sizing', () => {
  const updates = [];
  const recorder = createRecorder({}, {}, { environment: {}, onChange: info => updates.push(info) });
  assert.equal(recorder.supported, false); recorder.start(720);
  assert.equal(updates[0].status, 'error');
});

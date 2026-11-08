// recorder.js - Records the canvas and prepares a downloadable video.
(function (root) {
  'use strict';
  function createRecorder(canvas, adapter, options = {}) {
    const env = options.environment || root;
    const notify = options.onChange || (() => {});
    const mime = typeof env.MediaRecorder === 'function' &&
      ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(type => env.MediaRecorder.isTypeSupported(type));
    const supported = !!mime && typeof canvas.captureStream === 'function';
    let session = null, result = null, disposed = false;
    function publish(status, extra = {}) { if (!disposed) notify({ status, supported, result, ...extra }); }
    function releaseResult() {
      if (result) env.URL.revokeObjectURL(result.url);
      result = null;
    }
    // Stop capture and restore the preview, even if recording failed to start.
    function cleanup(current) {
      if (current.cleaned) return;
      current.cleaned = true;
      env.clearInterval(current.timer);
      if (current.stream) current.stream.getTracks().forEach(track => track.stop());
      adapter.pause();
      if (current.restore) current.restore();
      if (options.setBackground) options.setBackground(false);
      adapter.requestRender();
    }
    function fail(error) {
      const current = session;
      if (!current) return;
      session = null;
      current.discard = true;
      if (current.recorder && current.recorder.state !== 'inactive') {
        try { current.recorder.stop(); } catch (_) { /* Cleanup still releases the stream. */ }
      }
      cleanup(current);
      publish('error', { error: error.message || 'Recording failed.' });
    }
    // Combine the collected video chunks after the final data event.
    function finish(current) {
      if (session !== current) return;
      session = null;
      cleanup(current);
      try {
        if (!current.discard) {
          const type = current.recorder.mimeType || mime;
          const blob = new env.Blob(current.chunks, { type });
          if (!blob.size) throw new Error('The recording was empty. Try recording for a few seconds.');
          const url = env.URL.createObjectURL(blob);
          releaseResult();
          result = { url, filename: `logo-${current.height}p.${type.includes('mp4') ? 'mp4' : 'webm'}`, size: blob.size };
        }
        publish(current.discard ? 'cancelled' : 'ready');
      } catch (error) { publish('error', { error: error.message }); }
      current.chunks.length = 0;
    }
    // Request a stop; wait for the stop event before restoring the preview.
    function stop(cancel = false) {
      const current = session;
      if (!current || current.stopping) return;
      current.discard = cancel;
      current.stopping = true;
      env.clearInterval(current.timer);
      publish('stopping');
      try { current.recorder.stop(); } catch (error) { fail(error); }
    }
    function start(height) {
      if (disposed || session) return;
      if (!supported) { publish('error', { error: 'Video recording is unavailable in this browser.' }); return; }
      if (![720, 1080].includes(height)) { publish('error', { error: 'Select 720p or 1080p.' }); return; }
      const current = { height, chunks: [], cleaned: false, discard: false, stopping: false };
      session = current;
      publish('starting');
      try {
        current.restore = adapter.beginCaptureSize(height === 720 ? 1280 : 1920, height);
        // Stop setup if resizing caused a WebGL error.
        if (session !== current) { current.restore(); return; }
        if (options.setBackground) options.setBackground(true);
        adapter.reset();
        if (session !== current) return;
        current.stream = canvas.captureStream(30);
        current.recorder = new env.MediaRecorder(current.stream, { mimeType: mime, videoBitsPerSecond: height === 720 ? 5000000 : 8000000 });
        current.recorder.ondataavailable = event => {
          if (session === current && !current.discard && event.data.size) current.chunks.push(event.data);
        };
        current.recorder.onstop = () => finish(current);
        current.recorder.onerror = event => {
          if (session === current) fail(event.error || new Error('Video encoder failed.'));
        };
        current.recorder.start(1000);
        adapter.requestRender();
        if (session !== current) return;
        adapter.play();
        current.started = env.performance.now();
        publish('recording', { seconds: 0 });
        current.timer = env.setInterval(() => {
          const seconds = Math.floor((env.performance.now() - current.started) / 1000);
          publish('recording', { seconds });
          // Stop after 60 seconds to limit memory use.
          if (seconds >= 60) stop();
        }, 250);
      } catch (error) { fail(error); }
    }
    function dispose() {
      disposed = true;
      if (session) fail(new Error('Recording closed.'));
      releaseResult();
    }
    return { supported, start, stop: () => stop(false), cancel: () => stop(true), fail, dispose };
  }

  // Keep Stop and Cancel available while scene controls are locked.
  function initRecording(doc, state, adapter, view, canvas, setBackground) {
    const get = id => doc.getElementById(id), listeners = [], disabled = new Map();
    let recorder;
    function update(info) {
      const active = ['starting', 'recording', 'stopping'].includes(info.status);
      state.recording = active;
      if (active && disabled.size === 0) {
        const controls = doc.querySelectorAll ? doc.querySelectorAll('#sidebar input, #sidebar select, #sidebar button') : [];
        controls.forEach(control => {
          if (['recordStart', 'recordStop', 'recordCancel'].includes(control.id)) return;
          disabled.set(control, control.disabled); control.disabled = true;
        });
      }
      if (!active) { disabled.forEach((value, control) => { control.disabled = value; }); disabled.clear(); }
      get('recordStart').disabled = active || !info.supported;
      get('recordStop').disabled = info.status !== 'recording';
      get('recordCancel').disabled = info.status !== 'recording';
      get('recordResolution').disabled = active || !info.supported;
      const labels = { idle: 'Ready to record.', starting: 'Preparing recording...', stopping: 'Finishing video...', ready: 'Video ready to download.', cancelled: 'Recording cancelled.' };
      get('recordStatus').textContent = !info.supported ? 'Video recording is unavailable in this browser.' :
        info.status === 'recording' ? `Recording: ${info.seconds}s / 60s` : info.error || labels[info.status];
      const link = get('recordDownload');
      link.hidden = active || !info.result;
      if (info.result) { link.href = info.result.url; link.download = info.result.filename; }
      view.renderPlayback();
    }
    recorder = createRecorder(canvas, adapter, { onChange: update, setBackground });
    function on(id, fn) { const element = get(id); element.addEventListener('click', fn); listeners.push(() => element.removeEventListener('click', fn)); }
    on('recordStart', () => recorder.start(Number(get('recordResolution').value)));
    on('recordStop', () => recorder.stop()); on('recordCancel', () => recorder.cancel());
    update({ status: 'idle', supported: recorder.supported });
    return { fail: recorder.fail, dispose() { recorder.dispose(); listeners.forEach(fn => fn()); state.recording = false; } };
  }
  const api = { createRecorder, initRecording };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.M5 = Object.assign(root.M5 || {}, api);
})(typeof window === 'undefined' ? globalThis : window);

// Test-only WebGL adapter. Does not replace M2/M3/M5's production modules.
(function () {
    'use strict';
    var el = id => document.getElementById(id);
    var canvas = el('canvas'), error = el('error');
    var gl = canvas.getContext('webgl');
    if (!gl) { error.textContent = 'WebGL is unavailable in this browser.'; return; }
    function shader(type, source) {
        var value = gl.createShader(type);
        gl.shaderSource(value, source); gl.compileShader(value);
        if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(value));
        return value;
    }
    try {
        var program = gl.createProgram();
        gl.attachShader(program, shader(gl.VERTEX_SHADER, `
            attribute vec3 aPosition, aNormal, aColor;
            uniform mat4 uMatrix;
            varying vec3 vColor;
            void main() {
                gl_Position = uMatrix * vec4(aPosition, 1.0);
                float light = 0.45 + 0.55 * max(dot(aNormal, normalize(vec3(0.4,0.7,1.0))), 0.0);
                vColor = aColor * light;
            }`));
        gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `
            precision mediump float;
            varying vec3 vColor;
            void main() { gl_FragColor = vec4(vColor, 1.0); }`));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
        gl.useProgram(program);
        var buffers = {};
        for (var name of ['aPosition', 'aNormal', 'aColor']) {
            buffers[name] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers[name]);
            var location = gl.getAttribLocation(program, name);
            gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(location);
        }
        var indexBuffer = gl.createBuffer();
        var matrixLocation = gl.getUniformLocation(program, 'uMatrix');
        var mesh;
        var palette = [[0.28,0.88,0.81],[0.97,0.55,0.35],[0.57,0.65,1],[0.97,0.79,0.35],[0.90,0.45,0.68],[0.40,0.75,1]];
        gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);
        gl.clearColor(0.043, 0.063, 0.125, 1);
        function upload(name, data) {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers[name]);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        }
        function recolor() {
            var ids = el('colorMode').value === 'face' ? mesh.faceIds : mesh.letterIds;
            var colors = new Float32Array(ids.length * 3);
            ids.forEach((id, i) => colors.set(palette[id % palette.length], i * 3));
            upload('aColor', colors);
        }
        function rebuild() {
            for (var id of ['block', 'depth', 'spacing']) el(id + 'Value').textContent = Number(el(id).value).toFixed(1);
            try {
                // Validate/build before replacing GPU data, preserving the previous valid scene.
                var next = buildWordGeometry({word: el('word').value, blockSize: Number(el('block').value),
                    extrusionDepth: Number(el('depth').value), letterSpacing: Number(el('spacing').value)});
                mesh = next;
                upload('aPosition', mesh.positions); upload('aNormal', mesh.normals);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
                recolor(); error.textContent = '';
                el('stats').textContent = mesh.word + '\nBlocks: ' + mesh.blockCount + '\nVertices: ' + mesh.positions.length / 3 +
                    '\nTriangles: ' + mesh.indices.length / 3 + '\nDimensions: ' + mesh.bounds.size.map(n => n.toFixed(2)).join(' × ');
                draw();
            } catch (err) { error.textContent = err.message; }
        }
        function draw() {
            if (!mesh) return;
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            var width = Math.max(1, Math.round(canvas.clientWidth * dpr));
            var height = Math.max(1, Math.round(canvas.clientHeight * dpr));
            if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
            gl.viewport(0, 0, width, height);
            var yaw = Number(el('yaw').value) * Math.PI / 180;
            el('yawValue').textContent = el('yaw').value + '°';
            var c = Math.cos(yaw), s = Math.sin(yaw), aspect = width / height;
            // Orthographic fit of a bounding sphere: remains visible at every yaw.
            var radius = Math.hypot(...mesh.bounds.size) / 2;
            var halfHeight = radius * 1.15 / Math.min(1, aspect);
            var sx = 1 / (halfHeight * aspect), sy = 1 / halfHeight, sz = -1 / (radius * 2);
            // Column-major P * Ry. Geometry and diagnostic light share object space.
            gl.uniformMatrix4fv(matrixLocation, false, new Float32Array([
                sx*c,0,-sz*s,0, 0,sy,0,0, sx*s,0,sz*c,0, 0,0,0,1
            ]));
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
        }
        for (var id of ['word', 'block', 'depth', 'spacing']) el(id).addEventListener('input', rebuild);
        el('yaw').addEventListener('input', draw);
        el('colorMode').addEventListener('change', function () { recolor(); draw(); });
        el('front').addEventListener('click', function () { el('yaw').value = 0; draw(); });
        el('reset').addEventListener('click', function () {
            el('word').value = 'USM'; el('block').value = el('depth').value = el('spacing').value = 1;
            el('yaw').value = 20; el('colorMode').value = 'face'; rebuild();
        });
        window.addEventListener('resize', draw);
        rebuild();
    } catch (err) { error.textContent = err.message; }
})();

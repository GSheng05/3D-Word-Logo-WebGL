// M2: WebGL context and frame-state setup. Call initialize once at startup.
// M3 supplies camera/projection/viewport; M4 supplies the model matrix.
(function (root) {
    'use strict';

    function checkClearColour(value) {
        if (!value || value.length !== 4 ||
            !Array.from(value).every(channel =>
                Number.isFinite(channel) && channel >= 0 && channel <= 1)) {
            throw new TypeError('Clear colour must contain four numbers in [0, 1].');
        }
    }

    /** This repository's MV.js uses row arrays tagged with type: 'mat4'. */
    function flattenMatrix(matrix, name) {
        if (!Array.isArray(matrix) || matrix.type !== 'mat4' || matrix.length !== 4 ||
            !matrix.every(row => Array.isArray(row) && row.length === 4 &&
                row.every(value => Number.isFinite(value)))) {
            throw new TypeError(name + ' must be a finite MV.js 4-by-4 matrix.');
        }

        if (typeof root.flatten !== 'function') {
            throw new Error('Load Common/MV.js before drawing.');
        }

        // flatten already converts matrix storage for WebGL. Do not transpose again.
        const data = root.flatten(matrix);

        if (data.length !== 16 || !data.every(value => Number.isFinite(value))) {
            throw new RangeError(name + ' cannot be represented as a finite GPU matrix.');
        }

        return data;
    }

    /** Create a WebGL 1 renderer foundation for the supplied canvas. */
    function initialize(canvas, options = {}) {
        if (!canvas || typeof canvas.getContext !== 'function') {
            throw new TypeError('A canvas element is required.');
        }

        if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new TypeError('Renderer options must be an object.');
        }

        if (!root.M2 || !root.M2.shaders ||
            typeof root.M2.shaders.createProgram !== 'function') {
            throw new Error('Load shaders.js before initializing the renderer.');
        }

        if (!root.M2.buffers || typeof root.M2.buffers.create !== 'function') {
            throw new Error('Load buffers.js before initializing the renderer.');
        }

        // Transparent clearing lets the eventual M5 backdrop show through.
        const clearColour = options.clearColour === undefined
            ? [0, 0, 0, 0] : options.clearColour;

        checkClearColour(clearColour);

        const lighting = root.M2.lighting;
        if (!lighting) throw new Error('Load lighting.js before initializing the renderer.');
        let light = lighting.configure(lighting.defaults, {});
        let material = lighting.materials.Matte;

        // WebGL 1 matches the GLSL sources in shaders.js.
        // Context options are explicit here so depth testing is available.
        const gl = canvas.getContext('webgl', { alpha: true, depth: true });

        if (!gl) throw new Error('WebGL is unavailable for this canvas.');

        const shader = root.M2.shaders.createProgram(gl);
        const buffers = root.M2.buffers.create(gl);

        gl.useProgram(shader.program);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.depthMask(true);
        gl.clearDepth(1);
        gl.clearColor(...clearColour);

        let disposed = false;

        function ensureActive() {
            if (disposed) throw new Error('This renderer has been disposed.');
        }

        /** Change light settings for the next draw, including a paused redraw. */
        function setLight(changes) {
            ensureActive();
            light = lighting.configure(light, changes);
        }

        /** Validate the entire update before replacing the active material. */
        function setMaterial(changes) {
            ensureActive();
            material = lighting.configureMaterial(material, changes);
        }

        /** Clear the frame without advancing animation or scheduling a loop. */
        function clear() {
            ensureActive();
            gl.depthMask(true);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        /** Draw one frame using caller-supplied transforms; no animation is advanced. */
        function draw(matrices) {
            ensureActive();

            if (gl.isContextLost()) {
                throw new Error('Cannot draw: WebGL context is lost.');
            }

            if (buffers.indexCount === 0) {
                clear();
                return false;
            }

            if (!matrices) {
                throw new TypeError('Provide model, view and projection matrices.');
            }

            // Validate all three before changing uniforms or clearing the old frame.
            const model = flattenMatrix(matrices.model, 'Model');
            const view = flattenMatrix(matrices.view, 'View');
            const projection = flattenMatrix(matrices.projection, 'Projection');

            gl.useProgram(shader.program);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LESS);

            gl.uniformMatrix4fv(shader.uniforms.model, false, model);
            gl.uniformMatrix4fv(shader.uniforms.view, false, view);
            gl.uniformMatrix4fv(shader.uniforms.projection, false, projection);
            // The direction stays in world space as the model and camera move.
            gl.uniform3fv(shader.uniforms.lightDirection, light.direction);
            gl.uniform1f(shader.uniforms.lightIntensity, light.intensity);
            gl.uniform1f(shader.uniforms.ambient, lighting.ambient);
            gl.uniform1f(shader.uniforms.diffuseScale, material.diffuse);
            gl.uniform1f(shader.uniforms.specularTint, material.tint);
            gl.uniform1f(shader.uniforms.shininess, material.shininess);
            gl.uniform1f(shader.uniforms.specularIntensity, material.specularIntensity);
            buffers.bind(shader.attributes);
            clear();

            gl.drawElements(
                gl.TRIANGLES,
                buffers.indexCount,
                gl.UNSIGNED_SHORT,
                0
            );

            return true;
        }

        /** Change the background clear colour without recreating the program. */
        function setClearColour(value) {
            ensureActive();
            checkClearColour(value);
            gl.clearColor(...value);
        }

        /** Release this phase's GPU resource when the application shuts down. */
        function dispose() {
            if (disposed) return;

            buffers.dispose();

            if (gl.getParameter(gl.CURRENT_PROGRAM) === shader.program) {
                gl.useProgram(null);
            }

            gl.deleteProgram(shader.program);
            disposed = true;
        }

        return {
            gl, shader, buffers, clear, draw, setLight, setMaterial, setClearColour, dispose,

            // Match M5's existing adapter names; drawing is requested separately.
            replaceGeometry: buffers.replaceGeometry,
            updateColors: buffers.updateColors
        };
    }

    root.M2 = root.M2 || {};
    root.M2.webgl = { initialize };
})(window);
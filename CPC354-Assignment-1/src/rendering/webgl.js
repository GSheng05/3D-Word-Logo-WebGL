// M2: WebGL context orchestration, frame rendering, and resource lifecycle.
// Coordinates shaders, GPU buffers, camera/animation matrices, and lighting parameters.
(function (root) {
    'use strict';

    /** Helper: Validates that clear colour contains four normalized RGBA numbers in [0, 1]. */
    function checkClearColour(value) {
        if (!value || value.length !== 4 ||
            !Array.from(value).every(channel =>
                Number.isFinite(channel) && channel >= 0 && channel <= 1)) {
            throw new TypeError('Clear colour must contain four numbers in [0, 1].');
        }
    }

    /**
     * Validates and flattens an MV.js 4x4 matrix for WebGL uniform upload:
     * - Verifies that the input is a 4-by-4 row-array tagged with type: 'mat4'.
     * - Uses root.flatten() from Common/MV.js to convert to a 16-element Float32Array.
     * - Important: MV.js flatten() already converts matrix storage to column-major order;
     *   do not transpose the matrix again when passing to uniformMatrix4fv.
     */
    function flattenMatrix(matrix, name) {
        if (!Array.isArray(matrix) || matrix.type !== 'mat4' || matrix.length !== 4 ||
            !matrix.every(row => Array.isArray(row) && row.length === 4 &&
                row.every(value => Number.isFinite(value)))) {
            throw new TypeError(name + ' must be a finite MV.js 4-by-4 matrix.');
        }

        if (typeof root.flatten !== 'function') {
            throw new Error('Load Common/MV.js before drawing.');
        }

        const data = root.flatten(matrix);

        if (data.length !== 16 || !data.every(value => Number.isFinite(value))) {
            throw new RangeError(name + ' cannot be represented as a finite GPU matrix.');
        }

        return data;
    }

    /**
     * Initializes the WebGL 1 renderer for the supplied canvas element:
     * 1. Validates canvas and dependency availability (shaders, buffers, lighting).
     * 2. Requests WebGL context with { alpha: true, depth: true }.
     * 3. Configures depth testing (gl.LESS) so near surfaces occlude far surfaces.
     * 4. Sets a transparent clear colour [0, 0, 0, 0] so HTML/CSS backgrounds show through.
     */
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

        // Transparent clearing [0, 0, 0, 0] lets the web application CSS backdrop show through
        const clearColour = options.clearColour === undefined
            ? [0, 0, 0, 0] : options.clearColour;

        checkClearColour(clearColour);

        const lighting = root.M2.lighting;
        if (!lighting) throw new Error('Load lighting.js before initializing the renderer.');

        // Initialize default directional light and Matte material
        let light = lighting.configure(lighting.defaults, {});
        let material = lighting.materials.Matte;

        // Context creation: alpha enables canvas compositing; depth enables Z-buffering
        const gl = canvas.getContext('webgl', { alpha: true, depth: true });
        if (!gl) throw new Error('WebGL is unavailable for this canvas.');

        const shader = root.M2.shaders.createProgram(gl);
        const buffers = root.M2.buffers.create(gl);

        // Configure initial WebGL state
        gl.useProgram(shader.program);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);          // Only fragments with smaller depth pass
        gl.depthMask(true);             // Enable writing to depth buffer
        gl.clearDepth(1);               // Clear depth buffer to farthest plane
        gl.clearColor(...clearColour);  // Clear colour buffer to transparent black

        let disposed = false;

        /** Guard: Ensures renderer has not been decommissioned. */
        function ensureActive() {
            if (disposed) throw new Error('This renderer has been disposed.');
        }

        /**
         * Updates lighting settings (yaw, pitch, intensity) for the next draw call.
         * Affects shader parameters without uploading new geometry buffers.
         */
        function setLight(changes) {
            ensureActive();
            light = lighting.configure(light, changes);
        }

        /**
         * Updates active material preset and parameters (shininess, specular intensity).
         * Affects shader parameters without uploading new geometry buffers.
         */
        function setMaterial(changes) {
            ensureActive();
            material = lighting.configureMaterial(material, changes);
        }

        /** Clears colour and depth buffers to wipe previous frame artifacts. */
        function clear() {
            ensureActive();
            gl.depthMask(true);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        /**
         * Renders one complete frame using external model, view, and projection matrices:
         * 1. Validates and flattens MV.js matrices.
         * 2. Sets WebGL program and re-asserts depth testing.
         * 3. Uploads transformation matrices (model, view, projection) to uniforms.
         * 4. Uploads lighting and material parameters to uniforms.
         * 5. Binds mesh vertex attributes and index buffer.
         * 6. Clears framebuffer and executes gl.drawElements(gl.TRIANGLES, ...).
         */
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

            // Validate and convert MV.js 4x4 matrices into 1D Float32Arrays
            const model      = flattenMatrix(matrices.model, 'Model');
            const view       = flattenMatrix(matrices.view, 'View');
            const projection = flattenMatrix(matrices.projection, 'Projection');

            gl.useProgram(shader.program);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LESS);

            // Upload 4x4 transformation matrices (transpose is false because flatten() already formats)
            gl.uniformMatrix4fv(shader.uniforms.model, false, model);
            gl.uniformMatrix4fv(shader.uniforms.view, false, view);
            gl.uniformMatrix4fv(shader.uniforms.projection, false, projection);

            // Upload lighting and material uniforms (stays in fixed world space)
            gl.uniform3fv(shader.uniforms.lightDirection, light.direction);
            gl.uniform1f(shader.uniforms.lightIntensity, light.intensity);
            gl.uniform1f(shader.uniforms.ambient, lighting.ambient);
            gl.uniform1f(shader.uniforms.diffuseScale, material.diffuse);
            gl.uniform1f(shader.uniforms.specularTint, material.tint);
            gl.uniform1f(shader.uniforms.shininess, material.shininess);
            gl.uniform1f(shader.uniforms.specularIntensity, material.specularIntensity);

            // Connect GPU buffers to shader attributes and clear frame
            buffers.bind(shader.attributes);
            clear();

            // Draw indexed triangles using 16-bit unsigned integer indices
            gl.drawElements(gl.TRIANGLES, buffers.indexCount, gl.UNSIGNED_SHORT, 0);
            return true;
        }

        /** Updates the background clear colour dynamically without recreating the program. */
        function setClearColour(value) {
            ensureActive();
            checkClearColour(value);
            gl.clearColor(...value);
        }

        /**
         * Releases all GPU resources (buffers and shader program) on application shutdown.
         * Sets disposed flag to prevent subsequent operations.
         */
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

            // Expose buffer operations directly matching M5's adapter interface
            replaceGeometry: buffers.replaceGeometry,
            updateColors: buffers.updateColors
        };
    }

    root.M2 = root.M2 || {};
    root.M2.webgl = { initialize };
})(window);

// M2: WebGL context and frame-state setup. Call initialize once at startup.
// Buffers and draw calls are added in later phases. M3 owns resizing/viewport.
(function (root) {
    'use strict';

    /** Validate an RGBA clear colour before passing it to WebGL. */
    function checkClearColour(value) {
        if (
            !value ||
            value.length !== 4 ||
            !Array.from(value).every(channel =>
                Number.isFinite(channel) &&
                channel >= 0 &&
                channel <= 1
            )
        ) {
            throw new TypeError(
                'Clear colour must contain four numbers in [0, 1].'
            );
        }
    }

    /** Create a WebGL 1 renderer foundation for the supplied canvas. */
    function initialize(canvas, options = {}) {
        if (!canvas || typeof canvas.getContext !== 'function') {
            throw new TypeError('A canvas element is required.');
        }

        if (
            !options ||
            typeof options !== 'object' ||
            Array.isArray(options)
        ) {
            throw new TypeError('Renderer options must be an object.');
        }

        if (
            !root.M2 ||
            !root.M2.shaders ||
            typeof root.M2.shaders.createProgram !== 'function'
        ) {
            throw new Error(
                'Load shaders.js before initializing the renderer.'
            );
        }

        // Transparent clearing lets the eventual M5 backdrop show through.
        const clearColour = options.clearColour === undefined
            ? [0, 0, 0, 0]
            : options.clearColour;

        checkClearColour(clearColour);

        // WebGL 1 matches the GLSL sources in shaders.js.
        // Request a depth buffer so nearer surfaces can hide farther ones.
        const gl = canvas.getContext('webgl', {
            alpha: true,
            depth: true
        });

        if (!gl) {
            throw new Error('WebGL is unavailable for this canvas.');
        }

        const shader = root.M2.shaders.createProgram(gl);

        gl.useProgram(shader.program);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.depthMask(true);
        gl.clearDepth(1);
        gl.clearColor(...clearColour);

        let disposed = false;

        function ensureActive() {
            if (disposed) {
                throw new Error('This renderer has been disposed.');
            }
        }

        /** Clear the frame without advancing animation or scheduling a loop. */
        function clear() {
            ensureActive();
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        /** Change the background clear colour without recreating the program. */
        function setClearColour(value) {
            ensureActive();
            checkClearColour(value);
            gl.clearColor(...value);
        }

        /** Release this phase's GPU resource when the application shuts down. */
        function dispose() {
            if (disposed) {
                return;
            }

            if (gl.getParameter(gl.CURRENT_PROGRAM) === shader.program) {
                gl.useProgram(null);
            }

            gl.deleteProgram(shader.program);
            disposed = true;
        }

        return {
            gl,
            shader,
            clear,
            setClearColour,
            dispose
        };
    }

    root.M2 = root.M2 || {};
    root.M2.webgl = { initialize };
})(window);
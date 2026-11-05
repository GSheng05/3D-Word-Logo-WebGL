// M2: GLSL sources and program setup, loaded as a normal external script.
// This module has no DOM dependency and does not use Common/initShaders.js.
(function (root) {
    'use strict';

    // M1 supplies XYZ positions; M5 supplies RGBA colours.
    // webgl.js supplies model, view and projection for each draw.
    const vertexSource = `
        attribute vec3 aPosition;
        attribute vec4 aColour;

        uniform mat4 uModel;
        uniform mat4 uView;
        uniform mat4 uProjection;

        varying mediump vec4 vColour;

        void main() {
            gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
            vColour = aColour;
        }
    `;

    // Direct vertex colours isolate geometry/transforms; lighting comes later.
    const fragmentSource = `
        precision mediump float;

        varying mediump vec4 vColour;

        void main() {
            gl_FragColor = vColour;
        }
    `;

    /** Compile one stage and clean up its resource if compilation fails. */
    function compileShader(gl, type, source, label) {
        const shader = gl.createShader(type);

        if (!shader) {
            throw new Error('Unable to allocate the ' + label + ' shader.');
        }

        try {
            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw new Error(
                    label + ' shader compilation failed: ' +
                    (gl.getShaderInfoLog(shader) || 'No compiler log available.')
                );
            }

            return shader;
        } catch (error) {
            gl.deleteShader(shader);
            throw error;
        }
    }

    /** Build once and retain input locations for future buffer/draw work. */
    function createProgram(gl) {
        const shaders = [];
        const attached = [];
        let program = null;
        let ready = false;

        try {
            shaders.push(
                compileShader(gl, gl.VERTEX_SHADER, vertexSource, 'Vertex')
            );

            shaders.push(
                compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource, 'Fragment')
            );

            program = gl.createProgram();

            if (!program) {
                throw new Error('Unable to allocate the shader program.');
            }

            for (const shader of shaders) {
                gl.attachShader(program, shader);
                attached.push(shader);
            }

            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error(
                    'Shader linking failed: ' +
                    (gl.getProgramInfoLog(program) || 'No linker log available.')
                );
            }

            // These names are the internal contract with the GLSL above.
            const attributes = {
                position: gl.getAttribLocation(program, 'aPosition'),
                colour: gl.getAttribLocation(program, 'aColour')
            };

            const uniforms = {
                model: gl.getUniformLocation(program, 'uModel'),
                view: gl.getUniformLocation(program, 'uView'),
                projection: gl.getUniformLocation(program, 'uProjection')
            };

            for (const [name, location] of Object.entries(attributes)) {
                if (location === -1) {
                    throw new Error('Missing active attribute: ' + name);
                }
            }

            for (const [name, location] of Object.entries(uniforms)) {
                if (location === null) {
                    throw new Error('Missing active uniform: ' + name);
                }
            }

            ready = true;
            return { program, attributes, uniforms };
        } finally {
            // The linked executable survives deletion of temporary shaders.
            // Also release earlier stages when a later stage/link step fails.
            for (const shader of attached) {
                gl.detachShader(program, shader);
            }

            for (const shader of shaders) {
                gl.deleteShader(shader);
            }

            if (program && !ready) {
                gl.deleteProgram(program);
            }
        }
    }

    root.M2 = root.M2 || {};
    root.M2.shaders = { createProgram };
})(window);
// M2: GLSL sources and program setup, loaded as a normal external script.
// This module has no DOM dependency and does not use Common/initShaders.js.
(function (root) {
    'use strict';

    // M1 supplies XYZ positions; M5 supplies RGBA colours.
    // webgl.js supplies model, view and projection for each draw.
    const vertexSource = `
        attribute vec3 aPosition;
        attribute vec3 aNormal;
        attribute vec4 aColour;

        uniform mat4 uModel;
        uniform mat4 uView;
        uniform mat4 uProjection;
        uniform vec3 uLightDirection;

        varying mediump vec4 vColour;
        varying mediump float vDiffuse;
        varying mediump vec3 vReflection;
        varying mediump vec3 vToEye;

        void main() {
            vec4 worldPosition = uModel * vec4(aPosition, 1.0);
            vec4 eyePosition = uView * worldPosition;
            gl_Position = uProjection * eyePosition;

            // M4 uses uniform scaling. The upper 3x3 transforms the normal
            // without applying translation, and normalization removes scale.
            vec3 normal = mat3(uModel) * aNormal;
            float lengthN = length(normal);

            vDiffuse = 0.0;
            vReflection = vec3(0.0);

            if (lengthN > 0.0) {
                vec3 worldNormal = normal / lengthN;
                vDiffuse = max(dot(worldNormal, uLightDirection), 0.0);

                // Compute the reflection in world space, then rotate it into
                // camera space so it can be compared with the viewing direction.
                vReflection = mat3(uView) * reflect(-uLightDirection, worldNormal);
            }

            // With MV.js orthographic projection, all viewing rays are parallel.
            // Perspective viewing rays point from each surface point to the eye.
            vToEye = uProjection[2][3] == 0.0
                ? vec3(0.0, 0.0, 1.0)
                : -eyePosition.xyz;

            vColour = aColour;
        }
    `;

    // Evaluate Phong at each fragment so a highlight can fall between vertices.
    const fragmentSource = `
        precision mediump float;

        varying mediump vec4 vColour;
        varying mediump float vDiffuse;
        varying mediump vec3 vReflection;
        varying mediump vec3 vToEye;
        uniform float uLightIntensity;
        uniform float uAmbient;
        uniform float uDiffuseScale;
        uniform float uSpecularTint;
        uniform float uShininess;
        uniform float uSpecularIntensity;

        void main() {
            float brightness = uAmbient + (1.0 - uAmbient) * uLightIntensity * vDiffuse * uDiffuseScale;
            vec3 colour = vColour.rgb * brightness;
            if (vDiffuse > 0.0 && uSpecularIntensity > 0.0 && length(vToEye) > 0.0) {
                float alignment = max(dot(normalize(vReflection), normalize(vToEye)), 0.0);
                vec3 highlight = mix(vec3(1.0), vColour.rgb, uSpecularTint);
                colour += highlight * uLightIntensity * uSpecularIntensity * pow(alignment, uShininess);
            }
            gl_FragColor = vec4(colour, vColour.a);
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
                normal: gl.getAttribLocation(program, 'aNormal'),
                colour: gl.getAttribLocation(program, 'aColour')
            };

            const uniforms = {
                model: gl.getUniformLocation(program, 'uModel'),
                view: gl.getUniformLocation(program, 'uView'),
                projection: gl.getUniformLocation(program, 'uProjection'),
                lightDirection: gl.getUniformLocation(program, 'uLightDirection'),
                lightIntensity: gl.getUniformLocation(program, 'uLightIntensity'),
                ambient: gl.getUniformLocation(program, 'uAmbient'),
                diffuseScale: gl.getUniformLocation(program, 'uDiffuseScale'),
                specularTint: gl.getUniformLocation(program, 'uSpecularTint'),
                shininess: gl.getUniformLocation(program, 'uShininess'),
                specularIntensity: gl.getUniformLocation(program, 'uSpecularIntensity')
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
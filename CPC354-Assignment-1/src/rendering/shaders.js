// M2: GLSL shader sources and WebGL program setup.
// Loaded as a normal external script; has no DOM dependency.
// Implements vertex coordinate/normal transformations and per-fragment Phong illumination.
(function (root) {
    'use strict';

    // =========================================================================
    // VERTEX SHADER SOURCE
    // - Transforms vertices from local coordinates into clip space: p_clip = P * V * M * p_local
    // - Transforms surface normals into world space using the upper 3x3 model matrix.
    // - Computes Lambertian diffuse factor and world-to-camera reflection vectors.
    // - Determines viewing rays toward the camera (handling perspective & orthographic).
    // =========================================================================
    const vertexSource = `
        // Per-vertex attributes (supplied from GPU buffers via buffers.js)
        attribute vec3 aPosition;
        attribute vec3 aNormal;
        attribute vec4 aColour;

        // Global uniforms (supplied per draw call via webgl.js)
        uniform mat4 uModel;
        uniform mat4 uView;
        uniform mat4 uProjection;
        uniform vec3 uLightDirection;

        // Varyings interpolated across triangles and passed to the fragment shader
        varying mediump vec4 vColour;
        varying mediump float vDiffuse;
        varying mediump vec3 vReflection;
        varying mediump vec3 vToEye;

        void main() {
            // 1. Pipeline transformations: Local -> World -> Eye (Camera) -> Clip
            vec4 worldPosition = uModel * vec4(aPosition, 1.0);
            vec4 eyePosition = uView * worldPosition;
            gl_Position = uProjection * eyePosition;

            // 2. Normal transformation:
            // Extract the upper 3x3 of the model matrix to apply rotation without translation.
            // Under uniform scaling (s, s, s), normalizing the transformed vector restores unit length.
            vec3 normal = mat3(uModel) * aNormal;
            float lengthN = length(normal);

            vDiffuse = 0.0;
            vReflection = vec3(0.0);

            if (lengthN > 0.0) {
                vec3 worldNormal = normal / lengthN;

                // Lambert's cosine law: D = max(N · L, 0)
                vDiffuse = max(dot(worldNormal, uLightDirection), 0.0);

                // Compute reflection vector in world space: R = reflect(-L, N) = 2*(N·L)*N - L.
                // Then rotate R into camera/eye space via mat3(uView) to compare with viewing direction.
                vReflection = mat3(uView) * reflect(-uLightDirection, worldNormal);
            }

            // 3. View direction vector (vToEye):
            // In orthographic projection (uProjection[2][3] == 0.0), all viewing rays are parallel along +Z.
            // In perspective projection, the ray points from the surface point toward the camera eye.
            vToEye = uProjection[2][3] == 0.0 ? vec3(0.0, 0.0, 1.0) : -eyePosition.xyz;

            // Forward vertex colour directly to fragment interpolator
            vColour = aColour;
        }
    `;

    // =========================================================================
    // FRAGMENT SHADER SOURCE
    // - Evaluates per-fragment Phong illumination: Ambient + Diffuse + Specular.
    // - Evaluated per fragment so highlights remain sharp across large polygons.
    // - Supports metallic highlight tinting (white plastic vs tinted metal).
    // =========================================================================
    const fragmentSource = `
        precision mediump float;

        // Interpolated inputs from vertex shader
        varying mediump vec4 vColour;
        varying mediump float vDiffuse;
        varying mediump vec3 vReflection;
        varying mediump vec3 vToEye;

        // Lighting and material uniforms
        uniform float uLightIntensity;
        uniform float uAmbient;
        uniform float uDiffuseScale;
        uniform float uSpecularTint;
        uniform float uShininess;
        uniform float uSpecularIntensity;

        void main() {
            // 1. Ambient + Diffuse lighting:
            // Formula: B = A + (1 - A) * I * D * kd
            // Ensures unlit faces retain ambient base brightness (0.25).
            float brightness = uAmbient + (1.0 - uAmbient) * uLightIntensity * vDiffuse * uDiffuseScale;
            vec3 colour = vColour.rgb * brightness;

            // 2. Specular reflection (Phong highlight):
            // Evaluated only if the surface directly faces the light (vDiffuse > 0)
            // and the material has specular reflectivity (uSpecularIntensity > 0).
            if (vDiffuse > 0.0 && uSpecularIntensity > 0.0 && length(vToEye) > 0.0) {
                // Angular alignment between normalized reflection vector and viewing ray: max(R · V, 0)
                float alignment = max(dot(normalize(vReflection), normalize(vToEye)), 0.0);

                // Highlight colour:
                // - Dielectric/Glossy (tint = 0): pure white highlight (mix factor 0)
                // - Metallic (tint = 1): tinted by object's base vertex colour (mix factor 1)
                vec3 highlight = mix(vec3(1.0), vColour.rgb, uSpecularTint);

                // Add specular contribution: highlight * I * ks * (R · V)^n
                colour += highlight * uLightIntensity * uSpecularIntensity * pow(alignment, uShininess);
            }

            // 3. Write final pixel colour and alpha to framebuffer
            gl_FragColor = vec4(colour, vColour.a);
        }
    `;

    /**
     * Compiles an individual shader stage (VERTEX_SHADER or FRAGMENT_SHADER).
     * Validates compilation status, throws detailed diagnostic compiler log on error,
     * and guarantees shader resource deletion if compilation fails.
     */
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

    /**
     * Builds and links the complete WebGL shader program.
     * Caches attribute and uniform memory locations once for reuse during rendering.
     * Detaches and deletes individual shader objects to prevent GPU memory leaks.
     */
    function createProgram(gl) {
        const shaders = [];
        const attached = [];
        let program = null;
        let ready = false;

        try {
            // 1. Compile vertex and fragment stages
            shaders.push(
                compileShader(gl, gl.VERTEX_SHADER, vertexSource, 'Vertex')
            );
            shaders.push(
                compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource, 'Fragment')
            );

            // 2. Allocate and link program
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

            // 3. Query and cache attribute locations (internal contract with GLSL attributes)
            const attributes = {
                position: gl.getAttribLocation(program, 'aPosition'),
                normal: gl.getAttribLocation(program, 'aNormal'),
                colour: gl.getAttribLocation(program, 'aColour')
            };

            // 4. Query and cache uniform locations (internal contract with GLSL uniforms)
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

            // 5. Assert that all expected locations are valid
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
            // The linked executable survives deletion of temporary shader objects.
            // Detach and delete them to keep GPU memory clean.
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

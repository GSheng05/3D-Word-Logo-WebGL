// M2: GPU buffers for M1's indexed mesh and M5's RGBA colours.
// No geometry generation, colour calculation, animation or draw loop lives here.
(function (root) {
    'use strict';

    function validateColours(rgba, vertexCount) {
        if (
            !(rgba instanceof Float32Array) ||
            rgba.length !== vertexCount * 4
        ) {
            throw new TypeError(
                'Colours must be Float32Array RGBA records matching the vertices.'
            );
        }

        for (const value of rgba) {
            if (!Number.isFinite(value) || value < 0 || value > 1) {
                throw new RangeError(
                    'Colour channels must be finite numbers in [0, 1].'
                );
            }
        }
    }

    function validateMesh(mesh, rgba) {
        if (
            !mesh ||
            !(mesh.positions instanceof Float32Array) ||
            !mesh.positions.length ||
            mesh.positions.length % 3 !== 0
        ) {
            throw new TypeError(
                'Positions must be a nonempty Float32Array of XYZ records.'
            );
        }

        if (
            !(mesh.normals instanceof Float32Array) ||
            mesh.normals.length !== mesh.positions.length
        ) {
            throw new TypeError(
                'Normals must match the position records.'
            );
        }

        for (const array of [mesh.positions, mesh.normals]) {
            for (const value of array) {
                if (!Number.isFinite(value)) {
                    throw new RangeError(
                        'Positions and normals must contain finite numbers.'
                    );
                }
            }
        }

        const vertexCount = mesh.positions.length / 3;

        if (
            !(mesh.indices instanceof Uint16Array) ||
            !mesh.indices.length ||
            mesh.indices.length % 3 !== 0
        ) {
            throw new TypeError(
                'Indices must be a nonempty Uint16Array of triangles.'
            );
        }

        for (const index of mesh.indices) {
            if (index >= vertexCount) {
                throw new RangeError('Index exceeds the vertex count.');
            }
        }

        validateColours(rgba, vertexCount);
        return vertexCount;
    }

    /** Each manager owns the buffers for one active logo in one WebGL context. */
    function create(gl) {
        let active = null;
        let disposed = false;

        function ensureActive() {
            if (disposed) {
                throw new Error('The buffer manager has been disposed.');
            }
        }

        // WebGL normally reports errors through getError(), not exceptions.
        function checkGPU(label) {
            if (gl.isContextLost()) {
                throw new Error(
                    'WebGL context lost during ' + label + '.'
                );
            }

            const error = gl.getError();

            if (error !== gl.NO_ERROR) {
                throw new Error(
                    label + ': WebGL error 0x' + error.toString(16)
                );
            }
        }

        function release(buffers) {
            for (const buffer of Object.values(buffers)) {
                gl.deleteBuffer(buffer);
            }
        }

        /** Upload a candidate without disturbing the caller's buffer bindings. */
        function upload(target, data, usage) {
            const binding = target === gl.ARRAY_BUFFER
                ? gl.ARRAY_BUFFER_BINDING
                : gl.ELEMENT_ARRAY_BUFFER_BINDING;

            const previous = gl.getParameter(binding);
            const buffer = gl.createBuffer();

            if (!buffer) {
                throw new Error('Unable to allocate a GPU buffer.');
            }

            try {
                gl.bindBuffer(target, buffer);
                gl.bufferData(target, data, usage);
                checkGPU('Buffer upload');

                return buffer;
            } catch (error) {
                gl.deleteBuffer(buffer);
                throw error;
            } finally {
                gl.bindBuffer(target, previous);
            }
        }

        /** Commit a whole mesh only after every candidate buffer uploads. */
        function replaceGeometry(mesh, rgba) {
            ensureActive();

            const vertexCount = validateMesh(mesh, rgba);

            checkGPU('Before mesh replacement');

            const candidate = {};

            try {
                candidate.position = upload(
                    gl.ARRAY_BUFFER,
                    mesh.positions,
                    gl.STATIC_DRAW
                );

                candidate.normal = upload(
                    gl.ARRAY_BUFFER,
                    mesh.normals,
                    gl.STATIC_DRAW
                );

                candidate.colour = upload(
                    gl.ARRAY_BUFFER,
                    rgba,
                    gl.DYNAMIC_DRAW
                );

                candidate.index = upload(
                    gl.ELEMENT_ARRAY_BUFFER,
                    mesh.indices,
                    gl.STATIC_DRAW
                );
            } catch (error) {
                // Keep the previous active mesh and release failed candidates.
                release(candidate);
                throw error;
            }

            const previous = active;

            active = {
                buffers: candidate,
                vertexCount,
                indexCount: mesh.indices.length
            };

            if (previous) {
                release(previous.buffers);
            }
        }

        /** Replace only colour storage; geometry and its indices stay intact. */
        function updateColors(rgba) {
            ensureActive();

            if (!active) {
                throw new Error('Upload geometry before updating colours.');
            }

            validateColours(rgba, active.vertexCount);
            checkGPU('Before colour update');

            // Stage a new colour buffer so a failed upload retains old colours.
            const next = upload(
                gl.ARRAY_BUFFER,
                rgba,
                gl.DYNAMIC_DRAW
            );

            const previous = active.buffers.colour;

            active.buffers.colour = next;
            gl.deleteBuffer(previous);
        }

        /** Bind immediately before drawing, including after any replacement. */
        function bind(attributes) {
            ensureActive();

            if (!active) {
                return false;
            }

            if (!attributes) {
                throw new TypeError(
                    'Shader attribute locations are required.'
                );
            }

            const layout = [
                ['position', 3],
                ['normal', 3],
                ['colour', 4]
            ];

            // Normals are uploaded now but are unused by the Phase 1 shader.
            // Later lighting shaders can supply attributes.normal.
            const enabled = layout.filter(([name]) =>
                name !== 'normal' ||
                (
                    attributes.normal !== undefined &&
                    attributes.normal !== -1
                )
            );

            // Check all locations before changing attribute bindings.
            for (const [name] of enabled) {
                if (
                    !Number.isInteger(attributes[name]) ||
                    attributes[name] < 0
                ) {
                    throw new TypeError(
                        'Invalid shader attribute location: ' + name
                    );
                }
            }

            for (const [name, components] of enabled) {
                gl.bindBuffer(
                    gl.ARRAY_BUFFER,
                    active.buffers[name]
                );

                gl.vertexAttribPointer(
                    attributes[name],
                    components,
                    gl.FLOAT,
                    false,
                    0,
                    0
                );

                gl.enableVertexAttribArray(attributes[name]);
            }

            gl.bindBuffer(
                gl.ELEMENT_ARRAY_BUFFER,
                active.buffers.index
            );

            return true;
        }

        /** Release owned buffers once; safe to call during repeated cleanup. */
        function dispose() {
            if (disposed) {
                return;
            }

            if (active) {
                release(active.buffers);
            }

            active = null;
            disposed = true;
        }

        return {
            replaceGeometry,
            updateColors,
            bind,
            dispose,

            get vertexCount() {
                return active ? active.vertexCount : 0;
            },

            get indexCount() {
                return active ? active.indexCount : 0;
            }
        };
    }

    root.M2 = root.M2 || {};
    root.M2.buffers = { create };
})(window);
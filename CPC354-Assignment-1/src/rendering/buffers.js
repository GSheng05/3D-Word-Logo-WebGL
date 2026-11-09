// M2: GPU buffer management for M1's indexed mesh geometry and M5's RGBA colours.
// Provides safe, transactional buffer creation, replacement with automatic rollback,
// isolated dynamic colour updates, and shader attribute binding.
(function (root) {
    'use strict';

    /**
     * Validates that colour data matches the mesh vertex count and formatting rules.
     * - Must be a Float32Array of length 4 * vertexCount (RGBA components).
     * - Every channel must be a finite number within [0, 1].
     */
    function validateColours(rgba, vertexCount) {
        if (
            !(rgba instanceof Float32Array) || rgba.length !== vertexCount * 4) {
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

    /**
     * Validates that mesh geometry conforms to required WebGL structures before upload:
     * - positions: Float32Array of XYZ coordinates (length must be a multiple of 3).
     * - normals: Float32Array matching positions length.
     * - indices: Uint16Array of triangle vertex indices (length must be a multiple of 3).
     * - Every index must be strictly less than vertexCount.
     * Returns the validated vertexCount.
     */
    function validateMesh(mesh, rgba) {
        if (!mesh || !(mesh.positions instanceof Float32Array) || !mesh.positions.length || mesh.positions.length % 3 !== 0) {
            throw new TypeError('Positions must be a nonempty Float32Array of XYZ records.');
        }

        if (!(mesh.normals instanceof Float32Array) || mesh.normals.length !== mesh.positions.length) {
            throw new TypeError('Normals must match the position records.');
        }

        for (const array of [mesh.positions, mesh.normals]) {
            for (const value of array) {
                if (!Number.isFinite(value)) {
                    throw new RangeError('Positions and normals must contain finite numbers.');
                }
            }
        }

        const vertexCount = mesh.positions.length / 3;

        if (!(mesh.indices instanceof Uint16Array) || !mesh.indices.length || mesh.indices.length % 3 !== 0) {
            throw new TypeError('Indices must be a nonempty Uint16Array of triangles.');
        }

        for (const index of mesh.indices) {
            if (index >= vertexCount) {
                throw new RangeError('Index exceeds the vertex count.');
            }
        }

        validateColours(rgba, vertexCount);
        return vertexCount;
    }

    /**
     * Factory function: Creates a buffer manager instance for one WebGL context.
     * Manages the lifecycle of position, normal, colour, and index GPU buffers.
     */
    function create(gl) {
        let active = null;
        let disposed = false;

        /** Guard: Throws if operations are invoked on a disposed manager. */
        function ensureActive() {
            if (disposed) {
                throw new Error('The buffer manager has been disposed.');
            }
        }

        /** Helper: Checks for WebGL context loss or asynchronous GPU errors. */
        function checkGPU(label) {
            if (gl.isContextLost()) {
                throw new Error('WebGL context lost during ' + label + '.');
            }

            const error = gl.getError();
            if (error !== gl.NO_ERROR) {
                throw new Error(label + ': WebGL error 0x' + error.toString(16));
            }
        }

        /** Helper: Deletes an object map of WebGLBuffer handles. */
        function release(buffers) {
            for (const buffer of Object.values(buffers)) {
                gl.deleteBuffer(buffer);
            }
        }

        /**
         * State-preserving GPU buffer allocation and upload:
         * 1. Records the current buffer binding (ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER).
         * 2. Allocates and uploads data to a new GPU buffer.
         * 3. Always restores the previous binding via a `finally` block to prevent GL side effects.
         * 4. Deletes the allocated buffer if any error occurs during upload.
         */
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

        /**
         * Two-phase commit geometry replacement:
         * 1. Validates mesh and colours.
         * 2. Stages all four candidate buffers (position, normal, colour, index).
         * 3. Rollback: If any upload fails, deletes candidate buffers and keeps existing mesh active.
         * 4. Commit: If all uploads succeed, activates candidate buffers and releases old ones.
         */
        function replaceGeometry(mesh, rgba) {
            ensureActive();

            const vertexCount = validateMesh(mesh, rgba);
            checkGPU('Before mesh replacement');

            const candidate = {};

            try {
                // Upload vertex attributes and face indices
                candidate.position = upload(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
                candidate.normal   = upload(gl.ARRAY_BUFFER, mesh.normals,   gl.STATIC_DRAW);
                candidate.colour   = upload(gl.ARRAY_BUFFER, rgba,           gl.DYNAMIC_DRAW);
                candidate.index    = upload(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
            } catch (error) {
                // Rollback: Keep previous active mesh and clean up candidate allocations
                release(candidate);
                throw error;
            }

            // Commit: replace active state and delete obsolete buffers
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

        /**
         * Isolated dynamic colour replacement:
         * Stages and uploads only a new colour VBO under DYNAMIC_DRAW.
         * Preserves existing position, normal, and index buffers without reallocating geometry.
         */
        function updateColors(rgba) {
            ensureActive();

            if (!active) {
                throw new Error('Upload geometry before updating colours.');
            }

            validateColours(rgba, active.vertexCount);
            checkGPU('Before colour update');

            // Stage a new colour buffer so a failed upload retains the old colours
            const next = upload(gl.ARRAY_BUFFER, rgba, gl.DYNAMIC_DRAW);
            const previous = active.buffers.colour;

            active.buffers.colour = next;
            gl.deleteBuffer(previous);
        }

        /**
         * Connects active buffers to shader attribute locations immediately before drawing:
         * - Binds VBOs and configures vertexAttribPointer for position (3), normal (3), colour (4).
         * - Enables the corresponding vertex attribute arrays.
         * - Binds the index buffer to ELEMENT_ARRAY_BUFFER for gl.drawElements().
         */
        function bind(attributes) {
            ensureActive();

            if (!active) {
                return false;
            }

            if (!attributes) {
                throw new TypeError('Shader attribute locations are required.');
            }

            const layout = [
                ['position', 3],
                ['normal', 3],
                ['colour', 4]
            ];

            // Filter enabled attributes (normals can be conditionally omitted if not in shader)
            const enabled = layout.filter(([name]) =>
                name !== 'normal' || (attributes.normal !== undefined && attributes.normal !== -1)
            );

            // Validate all attribute locations before modifying GL state
            for (const [name] of enabled) {
                if (!Number.isInteger(attributes[name]) || attributes[name] < 0) {
                    throw new TypeError('Invalid shader attribute location: ' + name);
                }
            }

            // Bind each vertex buffer and attach to shader attribute
            for (const [name, components] of enabled) {
                gl.bindBuffer(gl.ARRAY_BUFFER, active.buffers[name]);
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

            // Bind element array buffer for indexed drawing
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, active.buffers.index);
            return true;
        }

        /**
         * Releases all GPU buffers owned by this manager.
         * Safe to call repeatedly during shutdown.
         */
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

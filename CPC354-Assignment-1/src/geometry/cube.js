// M1: independent CPU geometry; no DOM, WebGL context, or matrix library needed.
// Face IDs are stable so M5 can assign palettes without changing this mesh.
var GEOMETRY_FACE_NAMES = Object.freeze(['front', 'back', 'top', 'bottom', 'right', 'left']);

// Practical numerical limits shared by the public mesh builders and the UI.
// World units: 0.01..100 for block/depth, 0..100 for inter-letter spacing.
function validateGeometryNumber(value, name, allowZero) {
    var minimum = allowZero ? 0 : 0.01;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > 100) {
        throw new RangeError(name + ' must be a finite number from ' + minimum + ' to 100.');
    }
    return value;
}

function makeCube(blockSize = 1, extrusionDepth = 1) {
    validateGeometryNumber(blockSize, 'Block size', false);
    validateGeometryNumber(extrusionDepth, 'Extrusion depth', false);
    var x = blockSize / 2, y = blockSize / 2, z = extrusionDepth / 2;
    var corners = [
        [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z],
        [-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z]
    ];
    // Every quad is counterclockwise when viewed from outside the solid.
    var faces = [
        { corners: [0, 1, 2, 3], normal: [0, 0, 1] },
        { corners: [5, 4, 7, 6], normal: [0, 0, -1] },
        { corners: [3, 2, 6, 7], normal: [0, 1, 0] },
        { corners: [4, 5, 1, 0], normal: [0, -1, 0] },
        { corners: [1, 5, 6, 2], normal: [1, 0, 0] },
        { corners: [4, 0, 3, 7], normal: [-1, 0, 0] }
    ];
    var positions = [], normals = [], indices = [], faceIds = [];
    faces.forEach(function (face, faceId) {
        var base = positions.length / 3;
        face.corners.forEach(function (corner) {
            positions.push(...corners[corner]);
            normals.push(...face.normal);
            faceIds.push(faceId);
        });
        // Duplicate corner records across faces to preserve hard edge normals.
        indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    });
    return {
        positions: new Float32Array(positions), normals: new Float32Array(normals),
        indices: new Uint16Array(indices), faceIds: new Uint8Array(faceIds)
    };
}

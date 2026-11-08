
var GEOMETRY_FACE_NAMES = Object.freeze(['front', 'back', 'top', 'bottom', 'right', 'left']);
// Defines what index is which face

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
    var x = blockSize / 2;
    var y = blockSize / 2;
    var z = extrusionDepth / 2;
    var corners = [
        [-x, -y, z],   // 1. front-bottom-left
        [x, -y, z],    // 2. front-bottom-right
        [x, y, z],     // 3. front-top-right
        [-x, y, z],    // 4. front-top-left
        [-x, -y, -z],  // 5. back-bottom-left
        [x, -y, -z],   // 6. back-bottom-right
        [x, y, -z],    // 7. back-top-right
        [-x, y, -z]    // 8. back-top-left
    ];

    var faces = [
        { corners: [0, 1, 2, 3], normal: [0, 0, 1] },  //Front
        { corners: [5, 4, 7, 6], normal: [0, 0, -1] }, //Back
        { corners: [3, 2, 6, 7], normal: [0, 1, 0] },  //Top
        { corners: [4, 5, 1, 0], normal: [0, -1, 0] }, //Bottom
        { corners: [1, 5, 6, 2], normal: [1, 0, 0] },  //Right
        { corners: [4, 0, 3, 7], normal: [-1, 0, 0] }  //Left
    ];
    var positions = [], normals = [], indices = [], faceIds = [];
    faces.forEach(function (face, faceId) {
        var base = positions.length / 3;
        face.corners.forEach(function (corner) {
            positions.push(...corners[corner]);
            normals.push(...face.normal);
            faceIds.push(faceId);
        });
        
        indices.push(base, base + 1, base + 2, 
                    base, base + 2, base + 3);
    });
    return {
        positions: new Float32Array(positions), normals: new Float32Array(normals),
        indices: new Uint16Array(indices), faceIds: new Uint8Array(faceIds)
    };
}

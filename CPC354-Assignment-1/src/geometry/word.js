// M1: bitmap -> extruded blocks -> indexed word mesh -> centred bounds.
// Script dependencies: font.js, cube.js. Public API: validateWord(), buildWordGeometry().

function validateWord(input) {
    if (typeof input !== 'string') throw new TypeError('Word must be text.');
    var trimmed = input.trim();
    // Validate before uppercasing so non-ASCII characters cannot expand into letters.
    if (!/^[a-zA-Z]+$/.test(trimmed)) {
        throw new RangeError('Use letters A-Z only, without spaces or punctuation.');
    }
    if (trimmed.length < 2 || trimmed.length > 4) {
        throw new RangeError('Enter a word containing 2 to 4 letters.');
    }
    return trimmed.toUpperCase();
}

function geometryBounds(positions) {
    var min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (var i = 0; i < positions.length; i += 3) {
        for (var axis = 0; axis < 3; axis++) {
            min[axis] = Math.min(min[axis], positions[i + axis]);
            max[axis] = Math.max(max[axis], positions[i + axis]);
        }
    }
    return {
        min: min, max: max,
        size: max.map(function (value, axis) { return value - min[axis]; }),
        center: max.map(function (value, axis) { return (value + min[axis]) / 2; })
    };
}

function buildWordGeometry(options = {}) {
    if (options === null || typeof options !== 'object' || Array.isArray(options)) {
        throw new TypeError('Geometry options must be an object.');
    }
    var word = validateWord(options.word === undefined ? 'USM' : options.word);
    var blockSize = options.blockSize === undefined ? 1 : options.blockSize;
    var letterSpacing = options.letterSpacing === undefined ? 1 : options.letterSpacing;
    var extrusionDepth = options.extrusionDepth === undefined ? 1 : options.extrusionDepth;
    validateGeometryNumber(letterSpacing, 'Letter spacing', true);
    var cube = makeCube(blockSize, extrusionDepth);
    var positions = [], normals = [], indices = [], faceIds = [], letterIds = [];
    var blockCount = 0;
    for (var letter = 0; letter < word.length; letter++) {
        var bitmap = FONT_5X7[word[letter]];
        // Spacing is a world-unit gap between five-column character boxes.
        var startX = letter * (FONT_WIDTH * blockSize + letterSpacing);
        for (var row = 0; row < FONT_HEIGHT; row++) {
            for (var column = 0; column < FONT_WIDTH; column++) {
                if (bitmap[row][column] !== '#') continue;
                var offsetX = startX + column * blockSize;
                var offsetY = (FONT_HEIGHT - 1 - row) * blockSize;
                var vertexOffset = positions.length / 3;
                for (var v = 0; v < cube.positions.length; v += 3) {
                    positions.push(cube.positions[v] + offsetX,
                        cube.positions[v + 1] + offsetY, cube.positions[v + 2]);
                }
                normals.push(...cube.normals);
                faceIds.push(...cube.faceIds);
                for (var id = 0; id < cube.faceIds.length; id++) letterIds.push(letter);
                for (var index of cube.indices) indices.push(index + vertexOffset);
                blockCount++;
            }
        }
    }
    // Centre actual occupied geometry, including glyphs with unused outer columns.
    var originalBounds = geometryBounds(positions);
    for (var p = 0; p < positions.length; p++) positions[p] -= originalBounds.center[p % 3];
    var typedPositions = new Float32Array(positions);
    return {
        positions: typedPositions, normals: new Float32Array(normals),
        indices: new Uint16Array(indices), faceIds: new Uint8Array(faceIds),
        letterIds: new Uint8Array(letterIds), bounds: geometryBounds(typedPositions),
        word: word, blockCount: blockCount,
        parameters: { word: word, blockSize: blockSize, letterSpacing: letterSpacing, extrusionDepth: extrusionDepth }
    };
}

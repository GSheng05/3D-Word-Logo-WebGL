// Run: node --test test/geometry.test.cjs (no third-party dependencies).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({});
for (const name of ['font', 'cube', 'word']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/geometry', name + '.js'), 'utf8'), context);
}
const { makeCube, buildWordGeometry, validateWord, FONT_5X7 } = context;
const near = (a, b) => assert.ok(Math.abs(a - b) < 0.0001, `${a} != ${b}`);

function checkMesh(mesh) {
    const count = mesh.positions.length / 3;
    assert.equal(mesh.normals.length, mesh.positions.length);
    assert.equal(mesh.faceIds.length, count);
    for (const value of mesh.positions) assert.ok(Number.isFinite(value));
    for (const index of mesh.indices) assert.ok(index >= 0 && index < count);
    for (let i = 0; i < mesh.normals.length; i += 3) {
        near(Math.hypot(...mesh.normals.slice(i, i + 3)), 1);
    }
    // Cross product verifies every triangle's area and winding against its normal.
    for (let t = 0; t < mesh.indices.length; t += 3) {
        const ids = Array.from(mesh.indices.slice(t, t + 3), x => x * 3);
        const a = ids.map(i => Array.from(mesh.positions.slice(i, i + 3)));
        const u = a[1].map((x, i) => x - a[0][i]);
        const v = a[2].map((x, i) => x - a[0][i]);
        const cross = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
        const dot = cross.reduce((sum, x, i) => sum + x * mesh.normals[ids[0] + i], 0);
        assert.ok(dot > 0, 'Triangle must face its outward normal');
    }
}

test('all 26 glyphs have a valid nonempty 5x7 bitmap', () => {
    assert.equal(Object.keys(FONT_5X7).length, 26);
    for (const rows of Object.values(FONT_5X7)) {
        assert.equal(rows.length, 7);
        for (const row of rows) assert.match(row, /^[.#]{5}$/);
        assert.ok(rows.join('').includes('#'));
    }
});
test('block has 24 vertex records, 12 outward triangles, and independent depth', () => {
    const mesh = makeCube(2, 3);
    assert.equal(mesh.positions.length, 72);
    assert.equal(mesh.indices.length, 36);
    checkMesh(mesh);
    for (let axis = 0; axis < 3; axis++) {
        const values = Array.from(mesh.positions).filter((_, i) => i % 3 === axis);
        near(Math.max(...values) - Math.min(...values), axis === 2 ? 3 : 2);
    }
});
test('every supported glyph builds with valid index offsets, bounds and metadata', () => {
    for (const char of Object.keys(FONT_5X7)) {
        const mesh = buildWordGeometry({ word: char.repeat(4), blockSize: 0.3, extrusionDepth: 0.7 });
        checkMesh(mesh);
        const filled = FONT_5X7[char].join('').split('#').length - 1;
        assert.equal(mesh.blockCount, 4 * filled);
        assert.equal(mesh.positions.length / 3, mesh.blockCount * 24);
        assert.equal(mesh.indices.length, mesh.blockCount * 36);
        assert.equal(mesh.letterIds.length, mesh.positions.length / 3);
        assert.deepEqual([...new Set(mesh.letterIds)], [0, 1, 2, 3]);
        for (let a = 0; a < 3; a++) near(mesh.bounds.min[a], -mesh.bounds.max[a]);
    }
});
test('depth, size and spacing change only their documented dimensions', () => {
    const base = buildWordGeometry({ word: 'HHH' });
    const deep = buildWordGeometry({ word: 'HHH', extrusionDepth: 4 });
    near(deep.bounds.size[0], base.bounds.size[0]);
    near(deep.bounds.size[1], base.bounds.size[1]);
    near(deep.bounds.size[2], 4);
    const spaced = buildWordGeometry({ word: 'HHH', letterSpacing: 3 });
    near(spaced.bounds.size[0] - base.bounds.size[0], 4);
    const large = buildWordGeometry({ word: 'HHH', blockSize: 2 });
    near(large.bounds.size[0], 32);
    near(large.bounds.size[1], 14);
    near(large.bounds.size[2], base.bounds.size[2]);
});
test('normalization, defaults and deterministic generation', () => {
    assert.equal(validateWord(' usm '), 'USM');
    assert.equal(buildWordGeometry().word, 'USM');
    assert.deepEqual(buildWordGeometry({ word: 'TV' }), buildWordGeometry({ word: 'TV' }));
});
test('invalid inputs fail before producing a mesh', () => {
    for (const word of ['', 'A', 'ABCDE', 'A B', 'A1', 'A!', 'ßA', null, 123]) {
        assert.throws(() => buildWordGeometry({ word }));
    }
    for (const key of ['blockSize', 'extrusionDepth', 'letterSpacing']) {
        for (const value of [-1, NaN, Infinity, '1', null, 101]) {
            assert.throws(() => buildWordGeometry({ [key]: value }));
        }
    }
    assert.throws(() => makeCube(0));
    assert.throws(() => makeCube(1, 0));
    assert.throws(() => buildWordGeometry(null));
    assert.throws(() => buildWordGeometry([]));
    checkMesh(buildWordGeometry({ word: 'WWWW', blockSize: 0.01, extrusionDepth: 0.01, letterSpacing: 100 }));
    checkMesh(buildWordGeometry({ word: 'WWWW', blockSize: 100, extrusionDepth: 100, letterSpacing: 0 }));
});

// M2: world-space directional light settings shared by all logo draws.
(function (root) {
    'use strict';

    // Provisional preview defaults. The ambient fraction keeps unlit faces visible.
    const defaults = Object.freeze({ horizontal: -45, vertical: 35, intensity: 1 });
    const ambient = 0.25;

    // Preset coefficients apply to M5's base colour. Tint 1 colours the reflection.
    const materials = Object.freeze({
        Matte: Object.freeze({ shininess: 8, specularIntensity: 0, diffuse: 1, tint: 0 }),
        Glossy: Object.freeze({ shininess: 32, specularIntensity: 0.65, diffuse: 0.8, tint: 0 }),
        Metallic: Object.freeze({ shininess: 64, specularIntensity: 1, diffuse: 0.45, tint: 1 })
    });

    // Including a preset starts from its defaults. Slider-only edits use current values.
    function configureMaterial(current, changes) {
        if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
            throw new TypeError('Supply material settings as an object.');
        }
        for (const key of Object.keys(changes)) {
            if (!['preset', 'shininess', 'specularIntensity'].includes(key)) {
                throw new TypeError('Unknown material setting: ' + key);
            }
        }
        let base = current;
        if (Object.prototype.hasOwnProperty.call(changes, 'preset')) {
            if (typeof changes.preset !== 'string' ||
                !Object.prototype.hasOwnProperty.call(materials, changes.preset)) {
                throw new RangeError('Choose Matte, Glossy or Metallic.');
            }
            base = materials[changes.preset];
        }
        const material = { ...base, ...changes };
        inRange(material.shininess, 1, 128, 'Shininess');
        inRange(material.specularIntensity, 0, 1, 'Specular intensity');
        return material;
    }

    function inRange(value, min, max, name) {
        if (!Number.isFinite(value) || value < min || value > max) {
            throw new RangeError(name + ' must be a number from ' + min + ' to ' + max + '.');
        }
    }

    /** Validate a partial UI update before replacing the current light state. */
    function configure(previous, changes) {
        if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
            throw new TypeError('Supply lighting settings as an object.');
        }
        for (const key of Object.keys(changes)) {
            if (!Object.prototype.hasOwnProperty.call(defaults, key)) {
                throw new TypeError('Unknown lighting setting: ' + key);
            }
        }
        const { horizontal, vertical, intensity } = { ...previous, ...changes };
        inRange(horizontal, -180, 180, 'Horizontal angle');
        inRange(vertical, -90, 90, 'Vertical angle');
        inRange(intensity, 0, 1, 'Light intensity');

        // Direction points from the surface towards the light. Zero angles face +Z.
        const radians = Math.PI / 180;
        const yaw = horizontal * radians;
        const pitch = vertical * radians;
        const direction = new Float32Array([
            Math.cos(pitch) * Math.sin(yaw),
            Math.sin(pitch),
            Math.cos(pitch) * Math.cos(yaw)
        ]);
        return { horizontal, vertical, intensity, direction };
    }

    root.M2 = root.M2 || {};
    root.M2.lighting = { defaults, ambient, configure, materials, configureMaterial };
})(window);
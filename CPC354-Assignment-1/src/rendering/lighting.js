// M2: world-space directional light settings and Phong material presets.
// This module provides mathematical helpers to convert light yaw/pitch into
// 3D Cartesian vectors and defines the physical parameters for Matte, Glossy,
// and Metallic materials.
(function (root) {
    'use strict';

    // Default lighting settings:
    // - horizontal: -45 deg (light arrives from upper-left)
    // - vertical: 35 deg (light angled downward)
    // - intensity: 1.0 (full directional light power)
    const defaults = Object.freeze({ horizontal: -45, vertical: 35, intensity: 1 });

    // Baseline ambient light fraction (25%):
    // Ensures surfaces facing away from the directional light remain visible
    // and do not drop to pitch black.
    const ambient = 0.25;

    // Phong Material Presets:
    // - shininess (n): Controls specular highlight tightness/sharpness (higher = narrower pinpoint glint).
    // - specularIntensity (ks): Controls highlight brightness (0 = no highlight, 1 = maximum shine).
    // - diffuse (kd): Diffuse reflection scaling factor (metals absorb more diffuse light).
    // - tint (t): Specular reflection tinting (0 = pure white highlight for plastics/dielectrics;
    //             1 = base-colour-tinted highlight for metals).
    const materials = Object.freeze({
        Matte: Object.freeze({ shininess: 8, specularIntensity: 0, diffuse: 1, tint: 0 }),
        Glossy: Object.freeze({ shininess: 32, specularIntensity: 0.65, diffuse: 0.8, tint: 0 }),
        Metallic: Object.freeze({ shininess: 64, specularIntensity: 1, diffuse: 0.45, tint: 1 })
    });

    /**
     * Configures and validates material settings.
     * Starts from an optional preset (Matte, Glossy, Metallic) and applies any
     * explicit user overrides for shininess [1, 128] or specularIntensity [0, 1].
     */
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

    /** Helper: Asserts that a value is a finite number within [min, max]. */
    function inRange(value, min, max, name) {
        if (!Number.isFinite(value) || value < min || value > max) {
            throw new RangeError(name + ' must be a number from ' + min + ' to ' + max + '.');
        }
    }

    /**
     * Validates and updates lighting configuration.
     * Merges previous settings with changes, validates angular bounds:
     * - horizontal: [-180, 180] degrees (yaw)
     * - vertical: [-90, 90] degrees (pitch)
     * - intensity: [0, 1]
     * Computes the Cartesian light vector L = [cos(phi)*sin(theta), sin(phi), cos(phi)*cos(theta)]
     * pointing from the surface toward the light source.
     */
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

        // Convert spherical angles (degrees) to radians:
        // Direction vector L points from the surface towards the light.
        // At theta = 0, phi = 0, the direction vector points directly along +Z.
        const radians = Math.PI / 180;
        const yaw = horizontal * radians;
        const pitch = vertical * radians;
        const direction = new Float32Array([
            Math.cos(pitch) * Math.sin(yaw), // X = cos(pitch) * sin(yaw)
            Math.sin(pitch),                 // Y = sin(pitch)
            Math.cos(pitch) * Math.cos(yaw)  // Z = cos(pitch) * cos(yaw)
        ]);
        return { horizontal, vertical, intensity, direction };
    }

    root.M2 = root.M2 || {};
    root.M2.lighting = { defaults, ambient, configure, materials, configureMaterial };
})(window);

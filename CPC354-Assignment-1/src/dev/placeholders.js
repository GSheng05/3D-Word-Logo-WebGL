// =============================================================
// placeholders.js — TEMPORARY stand-ins for the interface contract
// -------------------------------------------------------------
// TEMPORARY. Nobody edits this file to build their feature.
// Write the real function in your own file; this placeholder then
// turns itself off.
//
// How it works:
//   This file loads AFTER every member's files (see index.html).
//   For each contract function it asks: "does a real one exist yet?"
//       typeof buildLogo !== "function"   ->  no real one, so add a stand-in
//   As soon as a member defines the real function in their own file,
//   the check is false and the stand-in here is skipped.
//
// The badge in the control panel lists every stand-in still in use.
// Helper names start with "ph" so they never clash with real code.
// The contract itself is described in docs/GUIDE.md.
// =============================================================

var phInUse = [];   // { name, owner } for every stand-in that is active

function markPlaceholder(name, owner) {
    phInUse.push({ name: name, owner: owner || "?" });
}

// ---- M1 Jason: geometry --------------------------------------

// One plain box per letter, so "USM" shows as three boxes side by side.
if (typeof buildLogo !== "function") {
    window.buildLogo = function (word, depth) {
        var W = 0.8, H = 1.0, GAP = 0.2, z = depth / 2;
        var total = word.length * W + (word.length - 1) * GAP;
        var pos = [], nor = [], face = [], letter = [];

        for (var k = 0; k < word.length; k++) {
            var x0 = -total / 2 + k * (W + GAP), x1 = x0 + W, y0 = -H / 2, y1 = H / 2;
            // Each side: 4 corners (anticlockwise seen from outside), normal, face type.
            var sides = [
                [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, 1], 0],      // front
                [[x1, y0, -z], [x0, y0, -z], [x0, y1, -z], [x1, y1, -z], [0, 0, -1], 1], // back
                [[x1, y0, z], [x1, y0, -z], [x1, y1, -z], [x1, y1, z], [1, 0, 0], 2],    // right
                [[x0, y0, -z], [x0, y0, z], [x0, y1, z], [x0, y1, -z], [-1, 0, 0], 2],   // left
                [[x0, y1, z], [x1, y1, z], [x1, y1, -z], [x0, y1, -z], [0, 1, 0], 2],    // top
                [[x0, y0, -z], [x1, y0, -z], [x1, y0, z], [x0, y0, z], [0, -1, 0], 2]    // bottom
            ];
            sides.forEach(function (s) {
                [0, 1, 2, 0, 2, 3].forEach(function (c) {   // 4 corners -> 2 triangles
                    pos.push(s[c][0], s[c][1], s[c][2]);
                    nor.push(s[4][0], s[4][1], s[4][2]);
                    face.push(s[5]);
                    letter.push(k);
                });
            });
        }
        return {
            positions:   new Float32Array(pos),
            normals:     new Float32Array(nor),
            faceType:    new Uint8Array(face),
            letterIndex: new Uint8Array(letter),
            vertexCount: pos.length / 3,
            bounds: { minX: -total / 2, maxX: total / 2, minY: -H / 2, maxY: H / 2, minZ: -z, maxZ: z }
        };
    };
    markPlaceholder("buildLogo", "M1");
}

// ---- M5 Chun Shang: interaction and colour -------------------

// Value of an element by id, or the fallback if it is missing or empty.
function phValue(id, fallback) {
    var el = document.getElementById(id);
    return (el && el.value !== "") ? el.value : fallback;
}

if (typeof readSettings !== "function") {
    window.readSettings = function () {
        return {
            word:       phValue("wordInput", "USM"),
            depth:      Number(phValue("depthSlider", 0.5)) || 0.5,
            speed:      Number(phValue("speedSlider", 60)) || 60,
            colorMode:  phValue("colorMode", "frontSide"),
            colorFront: phValue("colorFront", "#ffcc33"),
            colorSide:  phValue("colorSide", "#7a3fb0")
        };
    };
    markPlaceholder("readSettings", "M5");
}

if (typeof sanitizeWord !== "function") {
    window.sanitizeWord = function (text) {
        var letters = String(text == null ? "" : text).toUpperCase().replace(/[^A-Z]/g, "");
        return (letters.length >= 3 && letters.length <= 4) ? letters : "USM";
    };
    markPlaceholder("sanitizeWord", "M5");
}

if (typeof makeColors !== "function") {
    // "#rrggbb" -> [r, g, b] in 0..1
    var phHexToRgb = function (hex) {
        var n = parseInt(String(hex).slice(1), 16) || 0;
        return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
    };
    // Front faces get the front colour; everything else gets the side colour.
    // The colour mode (single / perLetter) is ignored here.
    window.makeColors = function (geometry, settings) {
        var front = phHexToRgb(settings.colorFront), side = phHexToRgb(settings.colorSide);
        var out = new Float32Array(geometry.vertexCount * 4);
        for (var v = 0; v < geometry.vertexCount; v++) {
            var c = (geometry.faceType[v] === 0) ? front : side;
            out.set([c[0], c[1], c[2], 1], v * 4);
        }
        return out;
    };
    markPlaceholder("makeColors", "M5");
}

if (typeof initUIControls !== "function") {
    window.initUIControls = function (onSettingsChange, onResize) {
        ["wordInput", "depthSlider", "colorFront", "colorSide", "colorMode"].forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener(id === "colorMode" ? "change" : "input", function () {
                var label = document.getElementById("depthValue");
                if (label) label.textContent = Number(phValue("depthSlider", 0.5)).toFixed(2);
                onSettingsChange();
            });
        });
        window.addEventListener("resize", onResize);
    };
    markPlaceholder("initUIControls", "M5");
}

// ---- M3 Yong Zhou: camera and matrices -----------------------

var PH_CAMERA_Z = 4;    // camera sits at (0, 0, 4) and looks at the origin
var PH_FOVY     = 45;   // vertical field of view in degrees

if (typeof resizeCanvas !== "function") {
    window.resizeCanvas = function (canvas, gl) {
        var dpr = window.devicePixelRatio || 1;
        var w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
        var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        gl.viewport(0, 0, w, h);
        return w / h;
    };
    markPlaceholder("resizeCanvas", "M3");
}

if (typeof getViewMatrix !== "function") {
    window.getViewMatrix = function () {
        return lookAt(vec3(0, 0, PH_CAMERA_Z), vec3(0, 0, 0), vec3(0, 1, 0));
    };
    markPlaceholder("getViewMatrix", "M3");
}

if (typeof getProjectionMatrix !== "function") {
    // mode is ignored here: always perspective. The real version adds "orthographic".
    window.getProjectionMatrix = function (aspect, mode) {
        return perspective(PH_FOVY, aspect, 0.1, 100);
    };
    markPlaceholder("getProjectionMatrix", "M3");
}

if (typeof getFitScale !== "function") {
    // Scale S so the logo's FRONT face fills 90% of the screen width,
    // and also fits the height. The front face sits at z = S * maxZ, so it is
    // closer to the camera than z = 0 and looks bigger; this formula allows for that.
    window.getFitScale = function (bounds, aspect) {
        var k  = 0.9 * 2 * Math.tan(radians(PH_FOVY) / 2);  // 90% of visible height per unit distance
        var w  = bounds.maxX - bounds.minX, h = bounds.maxY - bounds.minY, zf = bounds.maxZ;
        var sw = k * aspect * PH_CAMERA_Z / (w + k * aspect * zf);
        var sh = k * PH_CAMERA_Z / (h + k * zf);
        return Math.min(sw, sh);
    };
    markPlaceholder("getFitScale", "M3");
}

// ---- M2 Phing Hong: rendering --------------------------------
// These three share one shader program, so they switch off TOGETHER:
// the stand-ins are used only if none of the three is real yet.

var phHasRenderer = [typeof initRenderer, typeof uploadGeometry, typeof drawScene]
    .filter(function (t) { return t === "function"; }).length;

if (phHasRenderer === 0) {
    var phGL = null, phProgram = null, phCount = 0, phBuf = {};

    var PH_VERTEX = [
        "attribute vec3 aPosition;",
        "attribute vec3 aNormal;",
        "attribute vec4 aColor;",
        "uniform mat4 uModel, uView, uProjection;",
        "varying vec4 vColor;",
        "void main() {",
        "    vec3 n = normalize((uModel * vec4(aNormal, 0.0)).xyz);",
        "    float diffuse = max(dot(n, normalize(vec3(0.3, 0.5, 1.0))), 0.0);",
        "    vColor = vec4(aColor.rgb * (0.35 + 0.65 * diffuse), aColor.a);",
        "    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);",
        "}"
    ].join("\n");
    var PH_FRAGMENT = "precision mediump float; varying vec4 vColor; void main() { gl_FragColor = vColor; }";

    var phCompile = function (type, source) {
        var s = phGL.createShader(type);
        phGL.shaderSource(s, source);
        phGL.compileShader(s);
        if (!phGL.getShaderParameter(s, phGL.COMPILE_STATUS)) throw new Error(phGL.getShaderInfoLog(s));
        return s;
    };

    window.initRenderer = function (canvas) {
        phGL = canvas.getContext("webgl");
        if (!phGL) throw new Error("WebGL is not available in this browser");
        phProgram = phGL.createProgram();
        phGL.attachShader(phProgram, phCompile(phGL.VERTEX_SHADER, PH_VERTEX));
        phGL.attachShader(phProgram, phCompile(phGL.FRAGMENT_SHADER, PH_FRAGMENT));
        phGL.linkProgram(phProgram);
        phGL.useProgram(phProgram);
        ["aPosition", "aNormal", "aColor"].forEach(function (n) { phBuf[n] = phGL.createBuffer(); });
        phGL.clearColor(0.05, 0.06, 0.08, 1);
        phGL.enable(phGL.DEPTH_TEST);
        return phGL;
    };

    window.uploadGeometry = function (geometry, colors) {
        [["aPosition", geometry.positions, 3], ["aNormal", geometry.normals, 3], ["aColor", colors, 4]]
            .forEach(function (a) {
                var loc = phGL.getAttribLocation(phProgram, a[0]);
                phGL.bindBuffer(phGL.ARRAY_BUFFER, phBuf[a[0]]);
                phGL.bufferData(phGL.ARRAY_BUFFER, a[1], phGL.STATIC_DRAW);
                phGL.vertexAttribPointer(loc, a[2], phGL.FLOAT, false, 0, 0);
                phGL.enableVertexAttribArray(loc);
            });
        phCount = geometry.vertexCount;
    };

    window.drawScene = function (modelMatrix, viewMatrix, projectionMatrix) {
        phGL.clear(phGL.COLOR_BUFFER_BIT | phGL.DEPTH_BUFFER_BIT);
        phGL.uniformMatrix4fv(phGL.getUniformLocation(phProgram, "uModel"), false, flatten(modelMatrix));
        phGL.uniformMatrix4fv(phGL.getUniformLocation(phProgram, "uView"), false, flatten(viewMatrix));
        phGL.uniformMatrix4fv(phGL.getUniformLocation(phProgram, "uProjection"), false, flatten(projectionMatrix));
        phGL.drawArrays(phGL.TRIANGLES, 0, phCount);
    };
    markPlaceholder("initRenderer", "M2");
    markPlaceholder("uploadGeometry", "M2");
    markPlaceholder("drawScene", "M2");
} else if (phHasRenderer < 3) {
    console.error("M2: initRenderer, uploadGeometry and drawScene must all be defined together " +
                  "(only " + phHasRenderer + " of 3 found). See docs/GUIDE.md.");
}

// ---- Report what is still a placeholder ----------------------

(function () {
    var badge = document.getElementById("placeholderBadge");
    if (phInUse.length === 0) {
        console.info("All parts are real code");
        if (badge) { badge.textContent = "All parts are real code"; badge.className = "all-real"; }
        return;
    }
    var byOwner = {};
    phInUse.forEach(function (p) { (byOwner[p.owner] = byOwner[p.owner] || []).push(p.name); });
    var text = "Placeholders in use: " + Object.keys(byOwner).sort().map(function (o) {
        return o + " " + byOwner[o].join(", ");
    }).join(" · ");
    console.info(text);
    if (badge) badge.textContent = text;
})();

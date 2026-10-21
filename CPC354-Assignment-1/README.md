# 3D Word Logo – CPC354 Assignment 1

A TV-station style "ident": the word **USM** as a solid 3D logo that turns,
grows to fill the screen, and then keeps moving gently.
Built with plain HTML, JavaScript and WebGL 1. No build tools and no frameworks.

## How to run

Double-click `index.html`. It opens in your browser. No server is needed.

The yellow badge in the control panel lists the parts that are still temporary placeholders.

## Team guide

Read **[docs/GUIDE.md](docs/GUIDE.md)**: who owns which file, the git workflow,
the interface between the parts, and each member's tasks.

## Team

| Member | Part |
|---|---|
| M1 Jason | 3D geometry (letters, extrusion, normals) |
| M2 Phing Hong | Rendering and lighting |
| M3 Yong Zhou | Camera, projection, screen fit; `main.js` |
| M4 Jeffry | Animation engine |
| M5 Chun Shang | Interaction and colour |

## Credits

`Common/MV.js` and `Common/initShaders.js` are Edward Angel's WebGL helper library
(*Interactive Computer Graphics*, Angel & Shreiner), copied unchanged.
Source and commit: see [Common/SOURCE.md](Common/SOURCE.md).

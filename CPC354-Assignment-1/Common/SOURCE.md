# Where `Common/` comes from

`MV.js` and `initShaders.js` are Edward Angel's WebGL helper library.
They come with the textbook *Interactive Computer Graphics* (Angel & Shreiner).
We use them as the course allows. We did **not** write them, and we do not edit them.

| | |
|---|---|
| Source repo | https://github.com/jiayaozhang/Interactive-Computer-Graphics-WebGL |
| Folder | `Code update/Code update/Common/` |
| Commit copied from | `b89242ea751e3accbb9060563665c35f02b8c20a` |
| Copied on | 2026-10-21 |
| `MV.js` size | 27,948 bytes (unchanged) |
| `initShaders.js` size | 1,963 bytes (unchanged) |

## Notes for the team

1. **`flatten()` already transposes for us.**
   A matrix in `MV.js` is stored row by row (`m[row][col]`).
   WebGL wants column by column.
   `flatten(m)` does that conversion.
   So always upload a matrix like this, and **never transpose by hand**:

   ```js
   gl.uniformMatrix4fv(location, false, flatten(m));
   ```

2. **`scale()` takes three numbers: `scale(x, y, z)`.**
   For a uniform scale `s`, write `scale(s, s, s)`.
   (Jeffry's `animation.js` builds its own `uniformScale(s)`. That is also fine.)

3. **Do not name your own global variables `result` or `j`.**
   `translate()` and `flatten()` assign to `result` and `j` without `var`.
   In non-strict code, that writes to a global variable.
   A global of yours with the same name would be overwritten.

4. `initShaders(gl, vertexId, fragmentId)` reads shader code from
   `<script>` tags in `index.html`, found by their `id`.

## How to cite it in the report

> Angel, E. & Shreiner, D. *Interactive Computer Graphics*, WebGL helper library
> `MV.js` and `initShaders.js`, copied unchanged from
> https://github.com/jiayaozhang/Interactive-Computer-Graphics-WebGL
> (commit `b89242e`).

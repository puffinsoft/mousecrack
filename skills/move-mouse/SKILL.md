---
name: move-mouse
description: Synthesize organically varied, human-like mouse movement.
---

Use the `mousecrack` CLI command to move the mouse in a human-like fashion.

```
mousecrack move <x> <y>
```

Take note that this is not instant. It takes some time to generate the steps (due to model inference), and some time to move it.

If you want the actual steps:

```
mousecrack steps <fromX> <fromY> <toX> <toY>
```

Generates a JSON list in this format:

```
[
  { x: 100, y: 200, t: 0 },
  { x: 100, y: 205, t: 47.31494926635946 },
  { x: 98, y: 208, t: 58.22092157368676 },
  { x: 99, y: 215, t: 69.18651480056648 },
  { x: 99, y: 223, t: 80.10650182439865 },
  ...
]
```

`t` is in milliseconds.

---

An SDK is available for JS/TS.

```
import { move, steps } from 'mousecrack';

await move(200, 400);

// or alternatively...
const from = { x: 100, y: 200 }
const to = { x: 200, y: 400 }
await steps(from, to);

// [
//   { x: 100, y: 200, t: 0 },
//   { x: 95, y: 202, t: 10.528131778472712 },
//   { x: 90, y: 210, t: 21.040190062833986 },
//   { x: 81, y: 223, t: 31.892832399406224 },
//   ...
```
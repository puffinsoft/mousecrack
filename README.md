<p align="center">
    <img src="https://github.com/puffinsoft/mousecrack/raw/master/assets/banner.png" width="400" />
</p>

<p align="center">
Synthesize organically varied, human-like mouse movement.
</p>

<p align="center">
This project aims to test the abilities of deep-learning for mouse imitation.
</p>

<h3 align="center">See it in Action</h3>

https://github.com/user-attachments/assets/ed3339c3-c414-4605-b214-8acf03aca1c1

<p align="center">
    <i>Clearly, it's not perfect. But this is v0.1.0. Still a lot of fun stuff to try on the model side :).</i>
</p>

---

### Installation

```bash
npm i -g mousecrack
```

### Usage

> [!WARNING]  
> This project is still experimental! For educational purposes only.

Available as an SDK (for developers) and CLI (for agents).

#### SDK

```js
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

#### CLI

```bash
mousecrack move 200 400 # (x, y)
mousecrack steps 100 200 200 400 # from (x, y), to (x, y)
```

<details>
    <summary>Install the Skill</summary>


For Claude Code:
```
/plugin marketplace add puffinsoft/mousecrack
/plugin install move-mouse@mousecrack
```

For Codex:
```
codex plugin marketplace add puffinsoft/mousecrack
codex plugin add move-mouse@mousecrack
```

</details>

### How does it work?

Mousecrack treats mouse prediction like a time forecasting problem.

It models mouse movement as a change in position (`dx, dy`) and time (`dt`), and tries to predict the next step in this multivariate time series.

To avoid the [mode collapse](https://en.wikipedia.org/wiki/Mode_collapse) problem, Mousecrack uses a Mixture Density Network to model several trajectories as a probability distribution.

---

*Mousecrack* is open source software, licensed under the [MIT](LICENSE) license.

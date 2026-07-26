// index.ts
import ort from "onnxruntime-node";
import robot from "robotjs";
import { join } from "path";

// config.ts
var model_config = {
  pad: -999999,
  components: 5,
  inputDims: 5,
  outputDims: 3,
  minDelayMs: 2,
  epochs: 200,
  batchSize: 64,
  onnxModel: "model.onnx"
};

// util.ts
var componentParamSize = 2 * model_config.outputDims;
var paramsSize = model_config.components * (1 + componentParamSize);
function softplus(x) {
  return x > 20 ? x : Math.log1p(Math.exp(x));
}
function randomNormal(mean, stdDev) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stdDev;
}
function sampleFromMDN(params) {
  const { components, outputDims } = model_config;
  let bestIdx = 0;
  let bestGumbel = -Infinity;
  for (let i = 0; i < components; i++) {
    const u = Math.random();
    const gumbel = params[i] - Math.log(-Math.log(u));
    if (gumbel > bestGumbel) {
      bestGumbel = gumbel;
      bestIdx = i;
    }
  }
  const offset = components + bestIdx * componentParamSize;
  const sample = new Array(outputDims);
  for (let d = 0; d < outputDims; d++) {
    const mean = params[offset + d];
    const std = softplus(params[offset + outputDims + d]);
    sample[d] = randomNormal(mean, std);
  }
  return { dx: sample[0], dy: sample[1], dt: sample[2] };
}
function smoothPath(path, windowSize = 7) {
  if (path.length < windowSize) return path;
  const smoothed = [path[0]];
  const halfWindow = Math.floor(windowSize / 2);
  for (let i = 1; i < path.length - 1; i++) {
    const startIdx = Math.max(0, i - halfWindow);
    const endIdx = Math.min(path.length, i + halfWindow + 1);
    const window = path.slice(startIdx, endIdx);
    let sumX = 0;
    let sumY = 0;
    window.forEach(({ x, y }) => {
      sumX += x;
      sumY += y;
    });
    smoothed.push({
      x: Math.round(sumX / window.length),
      y: Math.round(sumY / window.length),
      t: path[i].t
      // don't smooth time
    });
  }
  smoothed.push(path[path.length - 1]);
  return smoothed;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// index.ts
var modelPath = join(import.meta.dirname, model_config.onnxModel);
var sessionPromise = null;
function getSession() {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(modelPath);
  }
  return sessionPromise;
}
async function generatePath({ session, start, end, maxSteps = 500 }) {
  let currX = start.x;
  let currY = start.y;
  let dxPrev = 0;
  let dyPrev = 0;
  let dtPrev = 0;
  let elapsedMs = 0;
  let lastDtStep = model_config.minDelayMs;
  const path = [{ x: Math.round(currX), y: Math.round(currY), t: elapsedMs }];
  const sequence = [];
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  for (let step = 0; step < maxSteps; step++) {
    const distX = end.x - currX;
    const distY = end.y - currY;
    if (Math.hypot(distX, distY) < 3) break;
    sequence.push([dxPrev, dyPrev, dtPrev, distX, distY]);
    const seqLen = sequence.length;
    const inputData = new Float32Array(seqLen * model_config.inputDims);
    for (let i = 0; i < seqLen; i++) {
      inputData.set(sequence[i], i * model_config.inputDims);
    }
    const tensor = new ort.Tensor("float32", inputData, [1, seqLen, model_config.inputDims]);
    const results = await session.run({ [inputName]: tensor });
    const outputData = results[outputName].data;
    const lastStepParams = outputData.slice(outputData.length - paramsSize);
    const { dx, dy, dt } = sampleFromMDN(lastStepParams);
    const dtStep = dt > 0 ? dt : model_config.minDelayMs;
    currX += dx;
    currY += dy;
    elapsedMs += dtStep;
    path.push({ x: Math.round(currX), y: Math.round(currY), t: elapsedMs });
    dxPrev = dx;
    dyPrev = dy;
    dtPrev = dtStep;
    lastDtStep = dtStep;
  }
  elapsedMs += lastDtStep;
  path.push({ x: Math.round(end.x), y: Math.round(end.y), t: elapsedMs });
  return path;
}
async function steps(start, end) {
  const session = await getSession();
  return generatePath({
    session,
    start,
    end
  });
}
async function move(x, y) {
  const session = await getSession();
  const start = robot.getMousePos();
  const rawPath = await generatePath({
    session,
    start: { x: start.x, y: start.y },
    end: { x, y }
  });
  const finalPath = smoothPath(rawPath, 7);
  let prevT = 0;
  for (const point of finalPath) {
    const waitMs = point.t - prevT;
    if (waitMs > 0) await sleep(waitMs);
    robot.moveMouse(point.x, point.y);
    prevT = point.t;
  }
}

export {
  steps,
  move
};

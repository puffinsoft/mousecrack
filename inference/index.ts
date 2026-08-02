import ort from 'onnxruntime-node';
import robot from 'robotjs';

import { join } from 'path';

import { model_config } from './config.ts';
import { smoothPath, sampleFromMDN, sleep, paramsSize } from './util.ts';

import { ModelType } from './config.ts';
export { ModelType } from './config.ts';

export interface Position {
    x: number;
    y: number;
}


export interface Step {
    x: number;
    y: number;
    t: number;
}

const sessions: Record<ModelType, Promise<ort.InferenceSession> | null> = {
    [ModelType.STANDARD]: null,
    [ModelType.LITE]: null
}

function getSession(type?: ModelType) {
    const realType = type ?? ModelType.STANDARD;
    if (!sessions[realType]) {
        const modelPath = join(import.meta.dirname, model_config.modelPaths[realType])
        sessions[realType] = ort.InferenceSession.create(modelPath)
    }
    return sessions[realType];
}

interface StepsParamsInterface {
    session: ort.InferenceSession;
    start: Position;
    end: Position;
    maxSteps?: number;
}

async function generatePath({ session, start, end, maxSteps = 500 }: StepsParamsInterface): Promise<Step[]> {
    let currX = start.x;
    let currY = start.y;
    let dxPrev = 0.0;
    let dyPrev = 0.0;
    let dtPrev = 0.0;
    let elapsedMs = 0.0;
    let lastDtStep = model_config.minDelayMs;

    const path: Step[] = [{ x: Math.round(currX), y: Math.round(currY), t: elapsedMs }];
    const sequence = [];

    const inputName = session.inputNames[0];
    const outputName = session.outputNames[0];

    for (let step = 0; step < maxSteps; step++) {
        const distX = end.x - currX;
        const distY = end.y - currY;

        if (Math.hypot(distX, distY) < 3.0) break;

        // let's not truncate history, pass full running back in to LSTM
        sequence.push([dxPrev, dyPrev, dtPrev, distX, distY]);

        const seqLen = sequence.length;
        const inputData = new Float32Array(seqLen * model_config.inputDims);
        for (let i = 0; i < seqLen; i++) {
            inputData.set(sequence[i], i * model_config.inputDims);
        }

        const tensor = new ort.Tensor('float32', inputData, [1, seqLen, model_config.inputDims]);
        const results = await session.run({ [inputName]: tensor });

        const outputData = results[outputName].data;
        const lastStepParams = outputData.slice(outputData.length - paramsSize);
        const { dx, dy, dt } = sampleFromMDN(lastStepParams);

        // safety clamp, just in case
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

    // force the absolute final coordinate to be exactly the target.
    elapsedMs += lastDtStep;
    path.push({ x: Math.round(end.x), y: Math.round(end.y), t: elapsedMs });

    return path;
}

export async function steps(start: Position, end: Position, type?: ModelType): Promise<Step[]> {
    const session = await getSession(type);
    return generatePath({
        session,
        start,
        end
    })
}

export async function move(x: number, y: number, type?: ModelType) {
    const session = await getSession(type);
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
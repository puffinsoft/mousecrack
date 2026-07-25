import { model_config } from "./config.ts";
import { type Position } from "./index.ts";

export const componentParamSize = 2 * model_config.outputDims;
export const paramsSize = model_config.components * (1 + componentParamSize);

export function softplus(x: number) {
    return x > 20 ? x : Math.log1p(Math.exp(x));
    // for large x, log(1 + exp(x)) is approx. x anyways
}

/**
 * generates a random number from a normal Gaussian distribution
 * using the Box-Muller Transform.
 * 
 * https://stackoverflow.com/q/25582882/14251221
 */
export function randomNormal(mean: number, stdDev: number) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
}


// generate prediction from MDN output
export function sampleFromMDN(params: any) {
    const { components, outputDims: outputDims } = model_config;

    /**
     * Gumbel-max trick
     */
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

    /**
     * create output sample
     */
    const offset = components + bestIdx * componentParamSize;
    const sample = new Array(outputDims);
    for (let d = 0; d < outputDims; d++) {
        const mean = params[offset + d];
        const std = softplus(params[offset + outputDims + d]);
        sample[d] = randomNormal(mean, std);
    }

    return { dx: sample[0], dy: sample[1], dt: sample[2] };
}

/**
 * sliding window average for each item
 * calculated by centering it in the window.
 */
export function smoothPath(path: any, windowSize = 7) {
    if (path.length < windowSize) return path;

    const smoothed = [path[0]];
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 1; i < path.length - 1; i++) {
        const startIdx = Math.max(0, i - halfWindow);
        const endIdx = Math.min(path.length, i + halfWindow + 1);
        const window = path.slice(startIdx, endIdx);

        let sumX = 0;
        let sumY = 0;
        window.forEach(({ x, y }: Position) => {
            sumX += x;
            sumY += y;
        })

        smoothed.push({
            x: Math.round(sumX / window.length),
            y: Math.round(sumY / window.length),
            t: path[i].t, // don't smooth time
        });
    }

    smoothed.push(path[path.length - 1]);
    return smoothed;
}

/**
 * https://stackoverflow.com/a/39914235/14251221
 */
export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
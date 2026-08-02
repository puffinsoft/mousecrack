export enum ModelType {
    STANDARD, LITE
}

export const model_config = {
    pad: -999999.0,
    components: 5,
    inputDims: 5,
    outputDims: 3,
    minDelayMs: 2.0,
    epochs: 200,
    batchSize: 64,
    modelPaths: {
        [ModelType.STANDARD]: "model.onnx",
        [ModelType.LITE]: "model_lite.onnx"
    },
};
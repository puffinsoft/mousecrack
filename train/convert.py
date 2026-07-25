"""
converts the PyTorch h5 model to ONNX.
"""

import tensorflow as tf
import tensorflow_probability as tfp
import tf2onnx
import tf_keras as keras
from config import model_config
from tf_keras.layers import LSTM, Dense, Input, Masking
from tf_keras.models import Sequential

tfd = tfp.distributions
tfpl = tfp.layers

original_model = Sequential(
    [
        Input(shape=(None, model_config["input_dims"])),
        Masking(mask_value=model_config["pad"]),
        LSTM(128, return_sequences=True),
        LSTM(128, return_sequences=True),
        Dense(
            int(
                tfpl.MixtureNormal.params_size(
                    num_components=model_config["components"],
                    event_shape=model_config["output_dims"],
                )
            )
        ),
        tfp.layers.MixtureNormal(
            num_components=model_config["components"],
            event_shape=model_config["output_dims"],
        ),
    ]
)

original_model.load_weights(model_config['pytorch_model'])

export_model = keras.Model(
    inputs=original_model.inputs, outputs=original_model.layers[-2].output
)

print("Converting to ONNX...")
spec = (
    tf.TensorSpec((1, None, model_config["input_dims"]), tf.float32, name="input"),
)

model_proto, _ = tf2onnx.convert.from_keras(
    export_model, input_signature=spec, output_path=model_config['onnx_model']
)

print("Conversion complete.")

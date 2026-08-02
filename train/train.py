import os

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import json

import tensorflow as tf

tf.get_logger().setLevel("ERROR")

import tensorflow_probability as tfp
import tf_keras
from config import model_config
from tf_keras.callbacks import ModelCheckpoint
from tf_keras.layers import LSTM, Dense, Input, Masking
from tf_keras.models import Sequential
from tf_keras.preprocessing.sequence import pad_sequences

tfd = tfp.distributions
tfpl = tfp.layers


def load_mouse_data(filepath):
    X_all = []
    Y_all = []

    with open(filepath, "r") as f:
        for line_num, line in enumerate(f, start=1):
            data = json.loads(line.strip())
            path = data.get("path", [])

            target_x = data["target"]["x"]
            target_y = data["target"]["y"]

            x_seq = []
            y_seq = []

            dx_prev = 0.0
            dy_prev = 0.0
            dt_prev = 0.0

            for i in range(1, len(path)):
                curr_pt = path[i]
                prev_pt = path[i - 1]

                dx_curr = curr_pt["x"] - prev_pt["x"]
                dy_curr = curr_pt["y"] - prev_pt["y"]
                dt_curr = curr_pt["timestamp"] - prev_pt["timestamp"]

                dist_x = target_x - prev_pt["x"]
                dist_y = target_y - prev_pt["y"]

                x_seq.append([dx_prev, dy_prev, dt_prev, dist_x, dist_y])
                y_seq.append([dx_curr, dy_curr, dt_curr])

                dx_prev = dx_curr
                dy_prev = dy_curr
                dt_prev = dt_curr

            X_all.append(x_seq)
            Y_all.append(y_seq)

    X_padded = pad_sequences(
        X_all, padding="post", dtype="float32", value=model_config["pad"]
    )
    Y_padded = pad_sequences(
        Y_all, padding="post", dtype="float32", value=model_config["pad"]
    )

    return X_padded, Y_padded


def mdn_loss(y_true, y_pred):
    """
    safe loss function that handles padding
    """
    mask = tf.math.not_equal(y_true[:, :, 0], model_config["pad"])
    mask = tf.cast(mask, tf.float32)

    safe_y_true = tf.where(
        tf.expand_dims(mask, -1) == 1.0, y_true, tf.zeros_like(y_true)
    )

    # log sum exp here
    loss = -y_pred.log_prob(safe_y_true) * mask

    return tf.reduce_sum(loss) / (tf.reduce_sum(mask) + 1e-8)


print("Parsing data...")
X_train, Y_train = load_mouse_data(model_config['data'])
print(f"Loaded {len(X_train)} paths.")


model = Sequential(
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
        tfpl.MixtureNormal(
            num_components=model_config["components"],
            event_shape=model_config["output_dims"],
        ),
    ]
)

model.compile(optimizer=tf_keras.optimizers.Adam(learning_rate=0.0005), loss=mdn_loss)
model.summary()

checkpoint_cb = ModelCheckpoint(
    filepath="model_checkpoint_epoch_{epoch:03d}.h5",
    save_weights_only=True,
    period=25,
    verbose=1
)

history = model.fit(
    X_train,
    Y_train,
    epochs=model_config["epochs"],
    batch_size=model_config["batch_size"],
    validation_split=0.1,
    callbacks=[checkpoint_cb]
)

model.save_weights(model_config["pytorch_model"])
print("\nTraining complete!")

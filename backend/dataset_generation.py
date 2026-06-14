import numpy as np
import pandas as pd

np.random.seed(42)

# Suppongo di ricevere i dati periodicamente ogni ora
# SUlla base di questo, genero un dataset di addestramento che 1000 ore
TRAIN_SIZE = 1000

timestamps_train = pd.date_range(start="2026-01-01", periods=TRAIN_SIZE, freq="H")

# Inclinazione traliccio (in gradi) lugo gli assi X e Y (da considerare baseline)
baseline_x, = 0.12
baseline_y = -0.05

# Misure in condizioni normali
# Poichè l'addestramento è NON SUPERVISIONATO, addestreremo il modello solo sulle condizioni normali (per esempio, l'inclinazione subisce solo solo micro-vibrazioni dovute al vento)
# L'obiettivo è che, in caso di variazioni dal comportamento "normale" delle misurazioni, il modello si renda conto che qualcosa non va
train_data = {
    "timestamp": timestamps_train,
    "rain_mm": np.random.choice([0.0, 0.2, 0.4], p=[0.9, 0.08, 0.02], size=TRAIN_SIZE),
    "umidity_pct": np.clip(np.random.normal(45, 5, size=TRAIN_SIZE), 10, 100),
    "temp_air": np.random.normal(15, 3, size=TRAIN_SIZE),
    "temp_soil": np.random.normal(13, 2, size=TRAIN_SIZE),
    "tilt_x": baseline_x + np.random.normal(0, 0.002, size=TRAIN_SIZE),
    "tilt_y": baseline_y + np.random.normal(0, 0.002, size=TRAIN_SIZE)
}

df_train_raw = pd.DataFrame(train_data)

# Genero ora un dataset di set
TEST_SIZE = 200

timestamps_test = pd.date_range(start="2026-03-01", periods=TEST_SIZE, freq="H")

test_data = {
    "timestamp": timestamps_test,
    "rain_mm": np.random.choice([0.0, 0.2, 0.4], p=[0.9, 0.08, 0.02], size=TEST_SIZE),
    "umidity_pct": np.clip(np.random.normal(45, 5, size=TEST_SIZE), 10, 100),
    "temp_air": np.random.normal(15, 3, size=TEST_SIZE),
    "temp_soil": np.random.normal(13, 2, size=TEST_SIZE),
    "tilt_x": baseline_x + np.random.normal(0, 0.002, size=TEST_SIZE),
    "tilt_y": baseline_y + np.random.normal(0, 0.002, size=TEST_SIZE)
}

df_test_raw = pd.DataFrame(test_data)
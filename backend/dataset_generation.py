import numpy as np
import pandas as pd

np.random.seed(42)

# Suppongo di ricevere i dati periodicamente ogni ora
# SUlla base di questo, genero un dataset di addestramento che 1000 ore
TRAIN_SIZE = 1000

timestamps_train = pd.date_range(start="2026-01-01", periods=TRAIN_SIZE, freq="H")

# Inclinazione traliccio (in gradi) lugo gli assi X e Y (da considerare baseline)
baseline_x = 0.12
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

df_train = pd.DataFrame(train_data)

with open("./backend/train_dataset.csv", "w") as f:
    df_train.to_csv(f, index=False)

# Genero ora un dataset di test, al termine del quale manipoleremo i dati affinché rappresentino una condizione anomala.
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

df_test = pd.DataFrame(test_data)

# Iniezione anomalia (inizio frana nelle ultime 30 ore del test set)
# Piove tantissimo, l'umidità del terreno aumenta e il traliccio inizia a inclinarsi progressivamente sull'asse Y, cedendo di 0.02 gradi ogni ora
df_test.loc[df_test.index[-30:], "rain_mm"] = np.random.uniform(2.0, 5.0, size=30)

df_test.loc[df_test.index[-30:], "umidity_pct"] = np.random.uniform(85, 95, size=30)

for i in range(30):
    df_test.loc[df_test.index[-30 + i], "tilt_y"] += (i * 0.02)
    
with open("./backend/test_dataset.csv", "w") as f:
    df_test.to_csv(f, index=False)
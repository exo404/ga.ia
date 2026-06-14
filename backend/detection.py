import pandas as pd
import numpy as np

from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf

tf.random.set_seed(42)

with open("./backend/train_dataset.csv", "r") as f:
    df_train_raw = pd.read_csv(f)

with open("./backend/test_dataset.csv", "r") as f:
    df_test_raw = pd.read_csv(f)

# ID traliccio
pylon_id = df_train_raw["pylon_id"]

# Inclinazione traliccio (in gradi) lungo gli assi X e Y (da considerare baseline)
baseline_x = 0.12
baseline_y = -0.05

def preprocess_pipeline(df, b_x, b_y):
    df_out = df.copy()
    
    # Calcolo la differenza dell'inclinazione rispetto alla baseline (lungo entrambi gli assi)
    df_out["delta_x"] = df_out["tilt_x"] - b_x
    df_out["delta_y"] = df_out["tilt_y"] - b_y
    
    # Seleziono le colonne numeriche che entreranno nell'LSTM
    features = ["rain_mm", "umidity_pct", "temp_air", "temp_soil", "delta_x", "delta_y"]
    
    return df_out[features]

X_train_raw = preprocess_pipeline(df_train_raw, baseline_x, baseline_y)
X_test_raw = preprocess_pipeline(df_test_raw, baseline_x, baseline_y)

# Scaling dei dati (le reti neurali sono sensibilissime, porto tutto tra 0 e 1)
scaler = MinMaxScaler()
X_train_scaled = scaler.fit_transform(X_train_raw)
X_test_scaled = scaler.transform(X_test_raw)

# Dimensione della finestra temporale passata da osservare (lookback window)
# 24 = 1 giorno; se vogliamo osservare finestre più lunghe per cercare di apprendere cambiamenti più lenti, questa dimensione va aumentata
LOOKBACK_WINDOW = 24

# Creazione delle finestre correvoli (sliding windows)
def create_loops(data, window_size):
    X_sequences = []
    for i in range(len(data) - window_size + 1):
        X_sequences.append(data[i : (i + window_size)])
    return np.array(X_sequences)

X_train_seq = create_loops(X_train_scaled, LOOKBACK_WINDOW)
X_test_seq = create_loops(X_test_scaled, LOOKBACK_WINDOW)

print(f"Shape del dataset di training: {X_train_seq.shape}")
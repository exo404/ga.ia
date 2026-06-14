import pandas as pd
import numpy as np

from sklearn.preprocessing import RobustScaler

import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, RepeatVector, TimeDistributed, Input

import pickle

tf.random.set_seed(42)

with open("./backend/train_dataset.csv", "r") as f:
    df_train_raw = pd.read_csv(f)

with open("./backend/test_dataset.csv", "r") as f:
    df_test_raw = pd.read_csv(f)

# ID traliccio
#pylon_id = df_train_raw["pylon_id"]

# Inclinazione traliccio (in gradi) lungo gli assi X e Y (da considerare baseline)
baseline_x = 0.12
baseline_y = -0.05

# Seleziono le colonne numeriche che entreranno nell'LSTM
feature_names = ["rain_mm", "umidity_pct", "temp_air", "temp_soil", "delta_x", "delta_y"]

def preprocess_pipeline(df, b_x, b_y, features):
    df_out = df.copy()
    
    # Calcolo la differenza dell'inclinazione rispetto alla baseline (lungo entrambi gli assi)
    df_out["delta_x"] = df_out["tilt_x"] - b_x
    df_out["delta_y"] = df_out["tilt_y"] - b_y
    
    return df_out[features]

X_train_raw = preprocess_pipeline(df_train_raw, baseline_x, baseline_y, feature_names)
X_test_raw = preprocess_pipeline(df_test_raw, baseline_x, baseline_y, feature_names)

# Scaling dei dati (le reti neurali sono sensibilissime, porto tutto tra 0 e 1)
scaler = RobustScaler()

scaler.fit(X_train_raw)

X_train_scaled = scaler.transform(X_train_raw)
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

#print(f"Shape del dataset di training: {X_train_seq.shape}")

timesteps = X_train_seq.shape[1]
num_features = X_train_seq.shape[2]

model = Sequential([
    Input(shape=(timesteps, num_features)),
    LSTM(32, activation="relu", return_sequences=False),
    RepeatVector(timesteps),
    LSTM(32, activation="relu", return_sequences=True),
    TimeDistributed(Dense(num_features))
])

model.compile(optimizer="adam", loss="mae")

#model.summary()

history = model.fit(
    X_train_seq, X_train_seq, 
    epochs=15, 
    batch_size=32, 
    validation_split=0.2, 
    verbose=1
)

print("\nCalcolo delle metriche di Anomaly Detection")

# Errore MAE (Mean Absolute Error) sulle ricostruzioni del Train Set
X_train_pred = model.predict(X_train_seq)
train_mae_loss = np.mean(np.abs(X_train_pred - X_train_seq), axis=(1, 2))

# Calcolo dei percentili che ci serviranno per lo score del rischio:
p95 = np.percentile(train_mae_loss, 95) # MAE normale
p99 = np.percentile(train_mae_loss, 99) # MAE massimo

def risk_score(mae, p95, p99):
    score = (mae - p95) / (p99 - p95)
    
    return score

# Calcoliamo ora l'errore MAE sul Test Set (dove c'è la frana simulata alla fine)
X_test_pred = model.predict(X_test_seq)

test_mae_loss = np.mean(np.abs(X_test_pred - X_test_seq), axis=(1, 2))

# Creiamo un DataFrame finale per visualizzare i risultati
df_dashboard = pd.DataFrame(index=df_test_raw.index[LOOKBACK_WINDOW-1:])
df_dashboard["Reconstruction_Error_MAE"] = test_mae_loss
df_dashboard["Risk_Score"] = risk_score(test_mae_loss, p95, p99)
df_dashboard["Anomaly"] = np.clip(risk_score(test_mae_loss, p95, p99), 0, 1)

# Stampiamo gli ultimi record per vedere se il modello intercetta la frana iniettata
print("\n--- Info Ultime 50 ore del Test Dataset ---")
print(df_dashboard.tail(50).to_string())

# Salvataggio del modello
model_path = "./backend/Autoencoder_LSTM.keras"
model.save(model_path)
print(f"Modello salvato con successo in: {model_path}")

# Salvataggio dello scaler
scaler_path = "./backend/Scaler.pkl"
with open(scaler_path, "wb") as f:
    pickle.dump(scaler, f)
print(f"Scaler salvato con successo in: {scaler_path}")

# Salvataggio dei parametri
parameters_path = "./backend/Parameters.pkl"
with open(parameters_path, "wb") as f:
    parameters = {
        "feature_names": feature_names,
        "LOOKBACK_WINDOW": LOOKBACK_WINDOW,
        "p95": p95,
        "p99": p99
    }
    
    pickle.dump(parameters, f)
print(f"Scaler salvato con successo in: {scaler_path}")
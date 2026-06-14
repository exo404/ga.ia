import pandas as pd
import numpy as np

import time

#from sklearn.preprocessing import MinMaxScaler

import tensorflow as tf
from tensorflow.keras.models import load_model
#from tensorflow.keras.layers import LSTM, Dense, RepeatVector, TimeDistributed, Input

import pickle

tf.random.set_seed(42)

with open("./backend/test_dataset.csv", "r") as f:
    df_test_raw = pd.read_csv(f)

# ID traliccio
#pylon_id = df_test_raw["pylon_id"]

# Inclinazione traliccio (in gradi) lungo gli assi X e Y (da considerare baseline)
baseline_x = 0.12
baseline_y = -0.05

with open("./backend/Scaler.pkl", "rb") as f:
    scaler = pickle.load(f)
    
with open("./backend/Parameters.pkl", "rb") as f:
    parameters = pickle.load(f)
    
model = load_model("./backend/Autoencoder_LSTM.keras")
    
#feature_names = ["rain_mm", "umidity_pct", "temp_air", "temp_soil", "delta_x", "delta_y"]

feature_names = parameters["feature_names"]
LOOKBACK_WINDOW = parameters["LOOKBACK_WINDOW"]
p95 = parameters["p95"]
p99 = parameters["p99"]

print("P95: ", p95)
print("P99: ", p99)

print("Sistema pronto. Avvio ricezione dati dai sensori sul campo...\n")
print("-" * 90)

realtime_buffer = []

print(f"LOG DI MONITORAGGIO TRALICCIO T1 IN DIRETTA (Un record elaborato ogni 2 secondi):")
print("-" * 90)

for idx, row in df_test_raw.iterrows():
    # Trasformiamo la riga corrente in un dizionario per simulare l'arrivo del pacchetto IoT
    pacchetto_iot = row.to_dict()
    
    # Accumuliamo il pacchetto nel nostro buffer temporale
    realtime_buffer.append(pacchetto_iot)
    
    # Se il buffer non ha ancora accumulato abbastanza ore (pari alla lookback window),
    # non possiamo fare la predizione LSTM. Continuiamo ad accumulare.
    if len(realtime_buffer) < LOOKBACK_WINDOW:
        print(f"[{pacchetto_iot['timestamp']}] Accumulo dati in corso... ({len(realtime_buffer)}/{LOOKBACK_WINDOW} ore)", end="\r")
        time.sleep(0.1) # Velocizziamo la fase iniziale di riempimento buffer
        continue

    # Manteniamo il buffer a dimensione fissa (scartiamo il record più vecchio di 7 giorni/24 ore)
    if len(realtime_buffer) > LOOKBACK_WINDOW:
        realtime_buffer.pop(0)

    # --- FASE 1: TRASFORMAZIONE DATA FRAME & FEATURE ENGINEERING ---
    df_buffer = pd.DataFrame(realtime_buffer)
    
    # Eseguiamo il calcolo dei Delta Inclinazione rispetto alle baseline fisse
    df_buffer["delta_x"] = df_buffer["tilt_x"] - baseline_x
    df_buffer["delta_y"] = df_buffer["tilt_y"] - baseline_y
    
    # Isoliamo solo le feature numeriche destinate al modello nell'ordine corretto
    df_features_grezze = df_buffer[feature_names]

    # --- FASE 2: SCALING & RESHAPE PER RETE LSTM ---
    # Applichiamo lo scaler caricato dal pkl
    scaled_data = scaler.transform(df_features_grezze)
    
    # Modifichiamo la forma (shape) per l'LSTM: da (24, 6) a (1, 24, 6) -> [Batch, Timesteps, Features]
    input_tensor = np.expand_dims(scaled_data, axis=0)

    # --- FASE 3: INFERENZA IN POCHI MILLISECONDI ---
    # verbose=0 evita che Keras stampi la barra di caricamento ad ogni ciclo
    sequenza_ricostruita = model.predict(input_tensor, verbose=0)

    # --- FASE 4: CALCOLO DEL RISCHIO STRUTTURALE ---
    # Calcoliamo l'errore MAE medio tra la sequenza originale e quella ricostruita dal modello
    mae_corrente = np.mean(np.abs(input_tensor - sequenza_ricostruita))
    
    def risk_score(mae, p95, p99):
        score = (mae - p95) / (p99 - p95)
    
        return np.clip(score, 0, 1)
    
    
    # Calcolo dell'Indice di Deviazione dalla Normalità
    indice_rischio = risk_score(mae_corrente, p95, p99)

    # --- FASE 5: LOGICA DELLE AZIONI DI CONTROLLO (SEMAFORO) ---
    timestamp_corrente = pacchetto_iot["timestamp"]
    
    if indice_rischio <= 0.75:
        stato = "🟢 VERDE (Normale)"
        azione = "Nessuna. Sistema stabile."
    else:
        stato = "🟡 GIALLO (Attenzione)"
        azione = "Allerta meteo. Monitoraggio frequenza sensori aumentato."
    
    #TBD: logica per dare un'allerta rossa
    
    #stato = "🔴 ROSSO (Allerta critica)"
    #azione = "ATTIVARE PROCEDURA DI REDISPATCHING ENERGETICO SULLA LINEA DI SOCCORSO!"

    # Stampiamo i risultati a schermo in modo leggibile
    print(f"[{timestamp_corrente}] MAE: {mae_corrente:.4f} | INDICE ANOMALIA: {indice_rischio:.2f} | STATO: {stato}")
    if indice_rischio > 0.75:
        print(f"    👉 AZIONE OPERATIVA: {azione}")
        print("-" * 90)

    # Pausa di 2 secondi per simulare il tempo reale prima del prossimo pacchetto dati
    time.sleep(2)
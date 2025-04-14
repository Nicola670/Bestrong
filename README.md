# Never Give Up – Progetto Palestra

## 🧠 Descrizione del progetto

Sviluppare un’applicazione web (con funzionalità **PWA** come extra) per la **gestione delle schede clienti di una palestra**.

La piattaforma sarà utilizzata sia dai **gestori/personal trainer** sia dai **clienti**, e permetterà:

- La creazione di account cliente
- La generazione e visualizzazione di schede di allenamento personalizzate
- La gestione di esercizi, macchinari, e parametri di esecuzione

---

## 🔧 Funzionalità richieste

### 👨‍🏫 Personal Trainer

- Creazione account clienti e visualizzazione lista clienti
- Creazione, modifica ed eliminazione delle schede cliente (con storico)
- Caricamento, modifica, cancellazione e filtraggio esercizi:
  - Filtro per gruppo muscolare, obiettivo, difficoltà
- Inserimento esercizi in schede cliente
- Caricamento dei **macchinari presenti in palestra** (nome sufficiente)

#### ✅ Dettagli esercizio

- **Nome**
- **Gruppi muscolari** (primari e secondari):
  - Spalle, Pettorali, Bicipiti, Avambracci, Addominali, Abduttori, Quadricipiti, Cardio, Stretching, Trapezi, Tricipiti, Dorsali, Glutei, Adduttori, Femorali, Polpacci
- **Obiettivo**:
  - Dimagrimento, Tonificazione, Massa muscolare, Mobilità, Propriocezione
- **Difficoltà**:
  - Facile, Medio, Difficile
- **Descrizione**
- **Immagine/Video** di esecuzione (es. da YouTube o AI)
- **Caratteristiche**:
  - Ripetizioni
  - Tempo di esecuzione
  - Tempo di recupero
  - Serie
  - Macchinario richiesto
  - Peso suggerito

#### ✅ Dettagli esercizio *all'interno di una scheda*

- Macchinario (se richiesto)
- Ripetizioni
- Tempo di esecuzione
- Serie
- Tempo di recupero
- Peso suggerito

---

### 🧍 Cliente

- Visualizzazione scheda personale
- Visualizzazione dettagli esercizio
- Modifica di:
  - Ripetizioni
  - Tempo esecuzione / recupero
  - Peso
- **Avvio allenamento**:
  - Schermata esercizio con immagine
  - Timer per tempo di esecuzione o recupero
  - Pulsante “Avanti” per passare all’esercizio successivo
- Visualizzazione storico schede

---

## 📄 Pagine richieste

### 🔎 About

- Componenti del gruppo
- Descrizione e significato del progetto

### 🚫 Pagina 404 personalizzata

Esempi di ispirazione:
- https://http.cat
- https://www.chess.com/dfqwefhejwqfewqfeqw

---

## 📚 Documentazione tecnica

### ✅ Requisiti

- Commenti nel codice per migliorare la leggibilità
- Documentazione che copra:
  - Funzionalità base
  - Scelte implementative (DB, struttura, strategie)
  - Responsività e framework grafico scelto
  - Tecnologie extra usate
  - Migliorie future
  - Progettazione: punti di forza e debolezza

---

## 📢 Presentazione finale

### 🎓 Parte tecnica (7 min – programmatori)

- Struttura DB
- Struttura Backend
- Struttura Frontend

### 💼 Parte prodotto (7 min – cliente)

- Dimostrazione funzionalità
- Responsività del sito

### 🗂 Parte progettuale (5 min – project manager)

- Divisione lavoro e ruoli
- Progettazione iniziale (Project Charter)
- Difficoltà principali
- Migliorie e sviluppi futuri

---

## 📝 Documentazione di progetto

Seguire esempio del libro (pag. 336), inclusi:

- Obiettivi
- Osservazioni iniziali (committente, rischi, ecc.)
- **Project Charter** (con WBS, Gantt, PERT)
- Analisi dei rischi
- Budget:
  - Consulenze (prof), team, servizi accessori
  - HW, SW, spazio online
  - Costo per task, test, riserva per rischi
- Ruoli
- Conclusioni

---

## 🗂 Gestione del progetto

- Utilizzo di **Git** obbligatorio per versionamento
- La **repository** Git sarà il solo documento da consegnare
- Durante lo sviluppo, è previsto un **meeting settimanale** per confrontare l'avanzamento col Gantt

---

## ✅ Extra consigliati

- Trasformare il sito in **PWA**
- Inserire video esplicativi per gli esercizi
- Utilizzare tecnologie AI o API per migliorare l’esperienza

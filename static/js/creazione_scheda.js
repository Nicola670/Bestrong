document.addEventListener('DOMContentLoaded', function() {
    // Variabili globali per i filtri
    window.filtroAttuale = {
        testo: '',
        gruppo: 'tutti'
    };
    
    // Prendi l'ID del cliente dall'URL
    const urlParams = new URLSearchParams(window.location.search);
    const clienteId = urlParams.get('id-cliente');
    
    // Mostra l'ID del cliente nella pagina
    document.getElementById('clienteId').textContent = clienteId || 'Non specificato';
    alert('ID cliente: ' + clienteId);


    // Se non c'è un ID cliente, mostra un avviso
    if (!clienteId) {
        alert('Attenzione: Nessun ID cliente specificato nell\'URL. Usa ?id-cliente=X nell\'URL.');
    } else {
        // Carica i dati del cliente (simulato)
        caricaDatiCliente(clienteId);
    }
    
    // Carica gli esercizi disponibili
    caricaEserciziDisponibili();
    
    // Imposta la data di inizio odierna come default
    const oggi = new Date().toISOString().split('T')[0];
    document.getElementById('dataInizio').value = oggi;
    
    // Imposta la data di fine a +30 giorni come default
    const dataFine = new Date();
    dataFine.setDate(dataFine.getDate() + 30);
    document.getElementById('dataFine').value = dataFine.toISOString().split('T')[0];
    
    // Imposta l'evento di ricerca degli esercizi
    document.getElementById('btnSearch').addEventListener('click', cercaEsercizi);
    document.getElementById('searchEsercizi').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            cercaEsercizi();
        }
    });
    
    // Imposta l'evento di salvataggio della scheda
    document.getElementById('salvaScheda').addEventListener('click', salvaScheda);
    
    // Configura il sistema drag and drop
    setupDragAndDrop();
});

// Aggiungi la costante per l'indirizzo del server
const ip_server = 'http://localhost:5001';

// Modifica la funzione per caricare i dati del cliente
async function caricaDatiCliente(clienteId) {
    try {
        const response = await fetch(`${ip_server}/api/client/${clienteId}`);
        if (!response.ok) {
            throw new Error('Cliente non trovato');
        }
        
        const clienteData = await response.json();
        
        // Aggiorna l'interfaccia con i dati del cliente
        document.getElementById('clienteNome').textContent = `${clienteData.username} ${clienteData.surname}`;
        document.getElementById('clienteEmail').textContent = clienteData.email;
        document.getElementById('clienteTelefono').textContent = clienteData.phone;
        
    } catch (error) {
        console.error('Errore nel caricamento dei dati del cliente:', error);
        alert('Errore nel caricamento dei dati del cliente');
    }
}

// Modifica la funzione per caricare gli esercizi disponibili
async function caricaEserciziDisponibili() {
    try {
        const response = await fetch(`${ip_server}/api/exercises`);
        if (!response.ok) {
            throw new Error('Errore nel caricamento degli esercizi');
        }

        const esercizi = await response.json();
        
        // Memorizza gli esercizi in una variabile globale per uso futuro
        window.eserciziDisponibili = esercizi;
        
        // Estrai i gruppi muscolari unici dalle risposte
        const gruppiMuscolari = [...new Set(esercizi.flatMap(e => e.muscoli_primari))].sort();
        
        // Popola il menu a tendina dei gruppi muscolari
        const filtroGruppiMuscolari = document.getElementById('filtroGruppiMuscolari');
        gruppiMuscolari.forEach(gruppo => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.className = 'dropdown-item';
            a.href = '#';
            a.dataset.gruppo = gruppo;
            a.textContent = gruppo;
            a.addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelectorAll('#filtroGruppiMuscolari .dropdown-item')
                    .forEach(el => el.classList.remove('active'));
                this.classList.add('active');
                document.getElementById('dropdownGruppiMuscolari').textContent = 'Gruppo: ' + gruppo;
                window.filtroAttuale.gruppo = gruppo;
                filtraEsercizi();
            });
            li.appendChild(a);
            filtroGruppiMuscolari.appendChild(li);
        });

        // Visualizza gli esercizi
        visualizzaEserciziDisponibili(esercizi);
        
    } catch (error) {
        console.error('Errore nel caricamento degli esercizi:', error);
        alert('Errore nel caricamento degli esercizi');
    }
}

// Funzione per visualizzare gli esercizi nella lista
function visualizzaEserciziDisponibili(esercizi) {
    const eserciziList = document.getElementById('eserciziList');
    eserciziList.innerHTML = ''; // Pulisci la lista
    
    if (esercizi.length === 0) {
        eserciziList.innerHTML = '<p class="text-center w-100">Nessun esercizio trovato</p>';
        return;
    }
    
    const template = document.getElementById('esercizioTemplate');
    
    esercizi.forEach(esercizio => {
        const clone = template.content.cloneNode(true);
        
        clone.querySelector('.esercizio-nome').textContent = esercizio.nome;
        
        // Badge per il gruppo muscolare primario
        const categoriaElement = clone.querySelector('.esercizio-categoria');
        categoriaElement.innerHTML = '';
        
        const badge = document.createElement('span');
        badge.className = `gruppo-muscolare-badge`;
        badge.textContent = esercizio.muscoli_primari[0]; // Prendi il primo muscolo primario
        categoriaElement.appendChild(badge);
        
        clone.querySelector('.esercizio-descrizione').textContent = esercizio.descrizione;
        
        const card = clone.querySelector('.esercizio-card');
        card.dataset.esercizioId = esercizio.id;
        card.dataset.gruppoMuscolare = esercizio.muscoli_primari[0];
        
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        
        eserciziList.appendChild(clone);
    });
}

// Funzione per cercare esercizi
function cercaEsercizi() {
    const searchText = document.getElementById('searchEsercizi').value.toLowerCase();
    
    // Aggiorna il filtro di testo
    window.filtroAttuale.testo = searchText;
    
    // Applica i filtri
    filtraEsercizi();
}

// Funzione per filtrare gli esercizi in base ai criteri attuali
function filtraEsercizi() {
    if (!window.eserciziDisponibili) return;
    
    // Applica entrambi i filtri: testo e gruppo muscolare
    const eserciziFiltrati = window.eserciziDisponibili.filter(esercizio => {
        // Filtro per testo di ricerca
        const matchTesto = 
            esercizio.nome.toLowerCase().includes(window.filtroAttuale.testo) || 
            esercizio.categoria.toLowerCase().includes(window.filtroAttuale.testo) ||
            esercizio.descrizione.toLowerCase().includes(window.filtroAttuale.testo);
        
        // Filtro per gruppo muscolare
        const matchGruppo = 
            window.filtroAttuale.gruppo === 'tutti' || 
            esercizio.gruppoMuscolare === window.filtroAttuale.gruppo;
        
        // L'esercizio deve soddisfare entrambi i criteri
        return matchTesto && matchGruppo;
    });
    
    // Aggiorna la visualizzazione
    visualizzaEserciziDisponibili(eserciziFiltrati);
}


// Funzione per configurare il drag and drop
function setupDragAndDrop() {
    const dropArea = document.getElementById('schedaEsercizi');
    
    // Aggiungi eventi per l'area di rilascio
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
}

// Gestore per l'inizio del drag
function handleDragStart(e) {
    // Memorizza l'ID dell'esercizio trascinato
    e.dataTransfer.setData('text/plain', e.target.dataset.esercizioId);
    
    // Aggiungi classe per lo stile durante il trascinamento
    e.target.classList.add('esercizio-dragging');
}

// Gestore per la fine del drag
function handleDragEnd(e) {
    // Rimuovi classe di stile
    e.target.classList.remove('esercizio-dragging');
}

// Gestore per quando un elemento viene trascinato sopra l'area di rilascio
function handleDragOver(e) {
    // Previeni il comportamento di default che impedirebbe il drop
    e.preventDefault();
    
    // Aggiungi classe di stile per evidenziare l'area di rilascio
    e.target.classList.add('dragover');
}

// Gestore per quando un elemento esce dall'area di rilascio
function handleDragLeave(e) {
    // Rimuovi classe di stile
    e.target.classList.remove('dragover');
}

// Gestore per quando un elemento viene rilasciato nell'area di rilascio
function handleDrop(e) {
    // Previeni il comportamento di default
    e.preventDefault();
    
    // Rimuovi classe di stile
    e.target.classList.remove('dragover');
    
    // Ottieni l'ID dell'esercizio
    const esercizioId = e.dataTransfer.getData('text/plain');
    
    // Verifica se l'esercizio è già stato aggiunto alla scheda
    const esercizioGiaAggiunto = document.querySelector(`.esercizio-scheda[data-esercizio-id="${esercizioId}"]`);
    if (esercizioGiaAggiunto) {
        alert('Questo esercizio è già stato aggiunto alla scheda.');
        return;
    }
    
    // Trova i dati dell'esercizio
    const esercizio = window.eserciziDisponibili.find(e => e.id.toString() === esercizioId);
    if (!esercizio) return;
    
    // Aggiungi l'esercizio alla scheda
    aggiungiEsercizioAllaScheda(esercizio);
}

// Funzione per aggiungere un esercizio alla scheda
function aggiungiEsercizioAllaScheda(esercizio) {
    const schedaEsercizi = document.getElementById('schedaEsercizi');
    const emptyMessage = document.getElementById('emptyMessage');
    
    // Nascondi il messaggio "Nessun esercizio aggiunto"
    if (emptyMessage) {
        emptyMessage.style.display = 'none';
    }
    
    // Usa il template per creare l'elemento esercizio nella scheda
    const template = document.getElementById('esercizioSchedaTemplate');
    const clone = template.content.cloneNode(true);
    
    // Aggiungi i dati dell'esercizio
    clone.querySelector('.esercizio-nome').textContent = esercizio.nome;
    
    // Sostituisci il testo della categoria con un badge per il gruppo muscolare
    const categoriaElement = clone.querySelector('.esercizio-categoria');
    categoriaElement.innerHTML = '';
    
    // Crea badge per ogni muscolo primario
    if (esercizio.muscoli_primari && esercizio.muscoli_primari.length > 0) {
        esercizio.muscoli_primari.forEach(muscolo => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-primary me-1';
            badge.textContent = muscolo;
            categoriaElement.appendChild(badge);
        });
    }
    
    // Aggiungi l'ID dell'esercizio come attributo data
    const esercizioScheda = clone.querySelector('.esercizio-scheda');
    esercizioScheda.dataset.esercizioId = esercizio.id;
    
    // Assicurati che gli input abbiano ID unici
    const uniqueId = `esercizio-${esercizio.id}`;
    const inputs = esercizioScheda.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        const baseId = input.id;
        input.id = `${baseId}-${uniqueId}`;
        const label = esercizioScheda.querySelector(`label[for="${baseId}"]`);
        if (label) {
            label.setAttribute('for', input.id);
        }
    });
    
    // Aggiungi evento per rimuovere l'esercizio
    const btnRemove = clone.querySelector('.remove-esercizio');
    btnRemove.addEventListener('click', function() {
        esercizioScheda.remove();
        
        // Se non ci sono più esercizi, mostra di nuovo il messaggio vuoto
        if (schedaEsercizi.querySelectorAll('.esercizio-scheda').length === 0) {
            emptyMessage.style.display = 'block';
        }
    });
    
    // Aggiungi l'esercizio alla scheda
    schedaEsercizi.appendChild(clone);
}

// Modifica la funzione per salvare la scheda
async function salvaScheda() {
    // Validazione dei campi
    const clienteId = document.getElementById('clienteId').textContent;
    if (!clienteId) {
        alert('ID cliente non valido');
        return;
    }

    const eserciziScheda = document.querySelectorAll('.esercizio-scheda');
    if (eserciziScheda.length === 0) {
        alert('Aggiungi almeno un esercizio alla scheda');
        return;
    }

    const esercizi = [];
    for (const el of eserciziScheda) {
        const esercizioId = el.dataset.esercizioId;
        const uniqueId = `esercizio-${esercizioId}`;
        
        const serie = document.getElementById(`serie-${uniqueId}`).value;
        const ripetizioni = document.getElementById(`ripetizioni-${uniqueId}`).value;
        const peso = document.getElementById(`peso-${uniqueId}`).value;
        const recupero = document.getElementById(`recupero-${uniqueId}`).value;

        if (!serie || !ripetizioni) {
            alert('Inserisci serie e ripetizioni per tutti gli esercizi');
            return;
        }

        esercizi.push({
            esercizio_id: parseInt(esercizioId),
            serie: parseInt(serie),
            ripetizioni: parseInt(ripetizioni),
            peso_kg: peso ? parseFloat(peso) : null,
            recupero_secondi: recupero ? parseInt(recupero) : null
        });
    }

    const schedaData = {
        cliente_id: parseInt(clienteId),
        esercizi: esercizi
    };

    try {
        const response = await fetch(`${ip_server}/api/schede`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(schedaData)
        });

        if (!response.ok) {
            throw new Error('Errore nel salvataggio della scheda');
        }

        const result = await response.json();
        alert('Scheda salvata con successo!');
        
        // Redirect alla dashboard o alla lista schede del cliente
        window.location.href = '/dashboard';

    } catch (error) {
        console.error('Errore nel salvataggio della scheda:', error);
        alert('Errore nel salvataggio della scheda: ' + error.message);
    }
}
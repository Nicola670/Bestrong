document.addEventListener('DOMContentLoaded', async () => {

    // Variabili globali per i filtri
    window.filtroAttuale = {
        testo: '',
        gruppo: 'tutti'
    };
    
    // Setup drag and drop
    setupDragAndDrop();
    // Carica gli esercizi disponibili
    await caricaEserciziDisponibili();
    
    // Ottieni l'ID della scheda dall'URL
    const urlParams = new URLSearchParams(window.location.search);
    const schedaId = urlParams.get('scheda_id'); // Modifica da 'id' a 'scheda_id'
    
    if (!schedaId) {
        alert('ID scheda non valido');
        window.history.back();
        return;
    }

    // Carica i dati della scheda
    await caricaScheda(schedaId);
});

async function caricaEserciziDisponibili() {
    try {
        const response = await fetch('/api/exercises'); // Rimuovi ip_server e usa path relativo
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
        
        // Aggiungi prima l'opzione "tutti"
        const liTutti = document.createElement('li');
        const aTutti = document.createElement('a');
        aTutti.className = 'dropdown-item active';
        aTutti.href = '#';
        aTutti.dataset.gruppo = 'tutti';
        aTutti.textContent = 'Tutti';
        aTutti.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('#filtroGruppiMuscolari .dropdown-item')
                .forEach(el => el.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('dropdownGruppiMuscolari').textContent = 'Filtra per gruppo';
            window.filtroAttuale.gruppo = 'tutti';
            filtraEsercizi();
        });
        liTutti.appendChild(aTutti);
        filtroGruppiMuscolari.appendChild(liTutti);
        
        // Aggiungi gli altri gruppi muscolari
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


async function caricaDatiCliente(schedaId) {
    try {
        const response = await fetch(`/api/schede/${schedaId}/cliente`);
        if (!response.ok) {
            throw new Error('Errore nel caricamento dei dati del cliente');
        }
        
        const clienteData = await response.json();
        
        // Aggiorna l'interfaccia con i dati del cliente
        document.getElementById('clienteNome').textContent = 
            `${clienteData.nome} ${clienteData.cognome}`;
        document.getElementById('clienteEmail').textContent = clienteData.email;
        
    } catch (error) {
        console.error('Errore:', error);
        alert('Errore nel caricamento dei dati del cliente');
    }
}

async function caricaScheda(schedaId) {
    try {
        await caricaDatiCliente(schedaId);

        const response = await fetch(`/api/schede/${schedaId}`);
        if (!response.ok) {
            throw new Error('Errore nel caricamento della scheda');
        }
        
        const scheda = await response.json();
        
        // Popola il form con i dati esistenti
        for (const esercizio of scheda.esercizi) {
            aggiungiEsercizioAllaScheda(esercizio);
        }
        
    } catch (error) {
        console.error('Errore:', error);
        alert('Errore nel caricamento della scheda');
    }
}

function aggiungiEsercizioAllaScheda(esercizio) {
    const schedaEsercizi = document.getElementById('schedaEsercizi');
    const emptyMessage = document.getElementById('emptyMessage');
    
    if (emptyMessage) {
        emptyMessage.style.display = 'none';
    }
    
    const template = document.getElementById('esercizioSchedaTemplate');
    const clone = template.content.cloneNode(true);
    
    // Imposta i dati dell'esercizio
    clone.querySelector('.esercizio-nome').textContent = esercizio.nome;
    clone.querySelector('.esercizio-categoria').textContent = esercizio.gruppo || '';
    
    const esercizioScheda = clone.querySelector('.esercizio-scheda');
    esercizioScheda.dataset.esercizioId = esercizio.id;
    
    // Imposta i valori degli input
    clone.querySelector('#serie').value = esercizio.serie || '';
    clone.querySelector('#ripetizioni').value = esercizio.ripetizioni || '';
    clone.querySelector('#peso').value = esercizio.peso_kg || '';
    clone.querySelector('#recupero').value = esercizio.recupero_secondi || '';
    clone.querySelector('#noteEsercizio').value = esercizio.note || '';
    
    // Aggiungi evento per rimuovere l'esercizio
    const btnRemove = clone.querySelector('.remove-esercizio');
    btnRemove.addEventListener('click', function() {
        esercizioScheda.remove();
        if (schedaEsercizi.querySelectorAll('.esercizio-scheda').length === 0) {
            emptyMessage.style.display = 'block';
        }
    });
    
    schedaEsercizi.appendChild(clone);
}

function setupDragAndDrop() {
    const dropArea = document.getElementById('schedaEsercizi');
    
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

// Funzione per cercare esercizi
function cercaEsercizi() {
    const searchText = document.getElementById('searchEsercizi').value.toLowerCase().trim();
    
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
            esercizio.descrizione.toLowerCase().includes(window.filtroAttuale.testo) ||
            (esercizio.muscoli_primari && esercizio.muscoli_primari.some(muscolo => 
                muscolo.toLowerCase().includes(window.filtroAttuale.testo)
            ));
        
        // Filtro per gruppo muscolare
        const matchGruppo = 
            window.filtroAttuale.gruppo === 'tutti' || 
            (esercizio.muscoli_primari && esercizio.muscoli_primari.includes(window.filtroAttuale.gruppo));
        
        return matchTesto && matchGruppo;
    });
    
    // Aggiorna la visualizzazione
    visualizzaEserciziDisponibili(eserciziFiltrati);
}

async function salvaModifiche() {
    const schedaId = new URLSearchParams(window.location.search).get('scheda_id');
    const esercizi = [];
    
    // Raccogli i dati degli esercizi
    document.querySelectorAll('.esercizio-scheda').forEach(el => {
        esercizi.push({
            esercizio_id: parseInt(el.dataset.esercizioId),
            serie: parseInt(el.querySelector('#serie').value) || 0,
            ripetizioni: parseInt(el.querySelector('#ripetizioni').value) || 0,
            peso_kg: parseFloat(el.querySelector('#peso').value) || null,
            recupero_secondi: parseInt(el.querySelector('#recupero').value) || null
        });
    });

    try {
        const response = await fetch(`/api/schede/${schedaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ esercizi }),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Errore nel salvataggio delle modifiche');
        }

        alert('Modifiche salvate con successo!');
        window.location.href = '/dashboard';
        
    } catch (error) {
        console.error('Errore:', error);
        alert('Errore durante il salvataggio delle modifiche');
    }
}


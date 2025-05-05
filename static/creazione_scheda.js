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

// Funzione per caricare i dati del cliente (simulata)
function caricaDatiCliente(clienteId) {
    // futura chiamata API per ottenere i dati reali del cliente
    // momentanea simulazione dei dati
    
    // Simulazione ritardo di rete
    setTimeout(() => {
        const clienteData = {
            id: clienteId,
            nome: 'Mario Rossi',
            email: 'mario.rossi@example.com',
            telefono: '+39 123 456 7890'
        };
        
        // Aggiorna l'interfaccia con i dati del cliente
        document.getElementById('clienteNome').textContent = clienteData.nome;
        document.getElementById('clienteEmail').textContent = clienteData.email;
        document.getElementById('clienteTelefono').textContent = clienteData.telefono;
    }, 500);
}


// Funzione per caricare gli esercizi disponibili (simulata)
function caricaEserciziDisponibili() {
      // futura chiamata API per ottenere i dati reali del cliente
    // momentanea simulazione dei dati
    
    const esercizi = [
        { id: 1, nome: 'Panca Piana', categoria: 'Petto', descrizione: 'Esercizio base per il petto', gruppoMuscolare: 'Petto' },
        { id: 2, nome: 'Squat', categoria: 'Gambe', descrizione: 'Esercizio composto per le gambe', gruppoMuscolare: 'Gambe' },
        { id: 3, nome: 'Stacchi da Terra', categoria: 'Schiena/Gambe', descrizione: 'Esercizio per schiena bassa e gambe', gruppoMuscolare: 'Schiena' },
        { id: 4, nome: 'Pull-up', categoria: 'Schiena/Braccia', descrizione: 'Esercizio per schiena alta e bicipiti', gruppoMuscolare: 'Schiena' },
        { id: 5, nome: 'Military Press', categoria: 'Spalle', descrizione: 'Esercizio per le spalle', gruppoMuscolare: 'Spalle' },
        { id: 6, nome: 'Curl con Bilanciere', categoria: 'Braccia', descrizione: 'Esercizio per i bicipiti', gruppoMuscolare: 'Braccia' },
        { id: 7, nome: 'Push-up', categoria: 'Petto/Braccia', descrizione: 'Esercizio a corpo libero per petto e tricipiti', gruppoMuscolare: 'Petto' },
        { id: 8, nome: 'Crunch', categoria: 'Addominali', descrizione: 'Esercizio per gli addominali superiori', gruppoMuscolare: 'Addominali' },
        { id: 9, nome: 'Plank', categoria: 'Core', descrizione: 'Esercizio isometrico per il core', gruppoMuscolare: 'Core' },
        { id: 10, nome: 'Leg Press', categoria: 'Gambe', descrizione: 'Esercizio per quadricipiti e glutei', gruppoMuscolare: 'Gambe' },
        { id: 11, nome: 'Lat Machine', categoria: 'Schiena', descrizione: 'Esercizio per dorsali', gruppoMuscolare: 'Schiena' },
        { id: 12, nome: 'Shoulder Press', categoria: 'Spalle', descrizione: 'Esercizio per deltoidi', gruppoMuscolare: 'Spalle' },
        { id: 13, nome: 'Piegamenti su Tricipiti', categoria: 'Braccia', descrizione: 'Esercizio per tricipiti', gruppoMuscolare: 'Braccia' },
        { id: 14, nome: 'Affondi', categoria: 'Gambe', descrizione: 'Esercizio per gambe e glutei', gruppoMuscolare: 'Gambe' },
        { id: 15, nome: 'Crunch Laterali', categoria: 'Addominali', descrizione: 'Esercizio per addominali obliqui', gruppoMuscolare: 'Addominali' },
        { id: 16, nome: 'Alzate Laterali', categoria: 'Spalle', descrizione: 'Esercizio per deltoidi laterali', gruppoMuscolare: 'Spalle' },
        { id: 17, nome: 'Rematore con Manubri', categoria: 'Schiena', descrizione: 'Esercizio per dorsali e parte centrale della schiena', gruppoMuscolare: 'Schiena' },
        { id: 18, nome: 'Estensioni Lombari', categoria: 'Schiena/Core', descrizione: 'Esercizio per lombi e core', gruppoMuscolare: 'Core' }
    ];
    
    // Memorizza gli esercizi in una variabile globale per uso futuro
    window.eserciziDisponibili = esercizi;
    
    // Estrai i gruppi muscolari unici
    const gruppiMuscolari = [...new Set(esercizi.map(e => e.gruppoMuscolare))].sort();
    
    // Popola il menu a tendina per filtrare per gruppo muscolare
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
            
            // Rimuovi la classe active da tutti gli elementi
            document.querySelectorAll('#filtroGruppiMuscolari .dropdown-item').forEach(el => {
                el.classList.remove('active');
            });
            
            // Aggiungi la classe active a questo elemento
            this.classList.add('active');
            
            // Aggiorna il testo del pulsante dropdown
            document.getElementById('dropdownGruppiMuscolari').textContent = 'Gruppo: ' + gruppo;
            
            // Aggiorna il filtro e visualizza
            window.filtroAttuale.gruppo = gruppo;
            filtraEsercizi();
        });
        
        li.appendChild(a);
        filtroGruppiMuscolari.appendChild(li);
    });
    
    // Aggiungi event listener al filtro "Tutti"
    document.querySelector('#filtroGruppiMuscolari .dropdown-item[data-gruppo="tutti"]').addEventListener('click', function(e) {
        e.preventDefault();
        
        // Rimuovi la classe active da tutti gli elementi
        document.querySelectorAll('#filtroGruppiMuscolari .dropdown-item').forEach(el => {
            el.classList.remove('active');
        });
        
        // Aggiungi la classe active a questo elemento
        this.classList.add('active');
        
        // Aggiorna il testo del pulsante dropdown
        document.getElementById('dropdownGruppiMuscolari').textContent = 'Filtra per gruppo';
        
        // Aggiorna il filtro e visualizza
        window.filtroAttuale.gruppo = 'tutti';
        filtraEsercizi();
    });
    
    // Visualizza gli esercizi nell'interfaccia
    visualizzaEserciziDisponibili(esercizi);
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
        
        // Inserisci i dati dell'esercizio nel template
        clone.querySelector('.esercizio-nome').textContent = esercizio.nome;
        
        // Sostituisci il testo della categoria con un badge per il gruppo muscolare
        const categoriaElement = clone.querySelector('.esercizio-categoria');
        categoriaElement.innerHTML = '';
        
        const badge = document.createElement('span');
        badge.className = `gruppo-muscolare-badge gruppo-${esercizio.gruppoMuscolare.toLowerCase()}`;
        badge.textContent = esercizio.gruppoMuscolare;
        categoriaElement.appendChild(badge);
        
        clone.querySelector('.esercizio-descrizione').textContent = esercizio.descrizione;
        
        // Aggiungi l'ID dell'esercizio come attributo data per recuperarlo in seguito
        const card = clone.querySelector('.esercizio-card');
        card.dataset.esercizioId = esercizio.id;
        card.dataset.gruppoMuscolare = esercizio.gruppoMuscolare;
        
        // Aggiungi eventi drag
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
    
    // Aggiungi clase di stile per evidenziare l'area di rilascio
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
    
    // ottieni l'ID dell'esercizio
    const esercizioId = e.dataTransfer.getData('text/plain');
    
    // Verifica se l'esercizio è già stato aggiunto alla scheda
    const esercizioGiaAggiunto = document.querySelector(`.esercizio-scheda[data-esercizio-id="${esercizioId}"]`);
    if (esercizioGiaAggiunto) {
        alert('Questo esercizio è già stato aggiunto alla scheda.');
        return;
    }
    
    // rova i dati dell'esercizio
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
    
    const badge = document.createElement('span');
    badge.className = `gruppo-muscolare-badge gruppo-${esercizio.gruppoMuscolare.toLowerCase()}`;
    badge.textContent = esercizio.gruppoMuscolare;
    categoriaElement.appendChild(badge);
    
    // Aggiungi l'ID dell'esercizio come attributo data
    const esercizioScheda = clone.querySelector('.esercizio-scheda');
    esercizioScheda.dataset.esercizioId = esercizio.id;
    esercizioScheda.dataset.gruppoMuscolare = esercizio.gruppoMuscolare;
    
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
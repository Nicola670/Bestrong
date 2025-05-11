// Elementi del DOM
const clientsGrid = document.getElementById('clientsGrid');
const addClientBtn = document.getElementById('addClientBtn');
const addClientModal = document.getElementById('addClientModal');
const closeAddModal = document.getElementById('closeAddModal');
const cancelAddClient = document.getElementById('cancelAddClient');
const addClientForm = document.getElementById('addClientForm');
const clientDetailsModal = document.getElementById('clientDetailsModal');
const closeDetailsModal = document.getElementById('closeDetailsModal');
const searchInput = document.getElementById('searchInput');
const workoutDetailsModal = document.getElementById('workoutDetailsModal');
const closeWorkoutModal = document.getElementById('closeWorkoutModal');

// Variabile per i clienti
let clients = [];

// Funzione per caricare i clienti dall'API
async function loadClientsFromAPI() {
    try {
        const response = await fetch('/api/clients');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        clients = data;
        console.log('DENTRO CARIACMENTO DA API', clients); // Debug
        loadClients(clients);
    } catch (error) {
        console.error('Error loading clients:', error);
        clientsGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Errore nel caricamento dei clienti</p>
            </div>
        `;
    }
}

// Funzione per ottenere le iniziali dal nome e cognome
function getInitials(nome, cognome) {
    return nome.charAt(0) + cognome.charAt(0);
}

// Funzione per creare una card cliente
function createClientCard(client) {
    console.log('CARD INIZIO:', client); // Debug

    const card = document.createElement('div');
    card.className = 'client-card';
    card.dataset.clientId = client.id;
    
    const initials = getInitials(client.nome, client.cognome);
    const obiettivoNome = client.obiettivo;
    console.log('obbiettivoNome:', obiettivoNome, 'Type:', typeof obiettivoNome ); 
    card.innerHTML = `
        <div class="client-avatar">
            <span>${initials}</span>
        </div>
        <div class="client-info">
            <h3>${client.nome} ${client.cognome}</h3>
            <p>${client.email}</p>
            <span class="client-tag tag-${obiettivoNome}">${obiettivoNome}</span>
        </div>
    `;
    // Memorizza sia l'ID che il nome dell'obiettivo nei dati del client
    client.obiettivo_id = client.obiettivo_id;
    client.obiettivo = obiettivoNome;
    console.log('CARD FINE FUNZIONE:', client); // Debug

    card.addEventListener('click', () => showClientDetails(client));
    
    return card;
}

// Funzione per calcolare l'età
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

// Funzione per formattare la data
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Funzione per mostrare i dettagli del cliente
function showClientDetails(client) {
    const clientDetailsName = document.getElementById('clientDetailsName');
    clientDetailsName.textContent = `Dettagli Cliente`;
    clientDetailsName.setAttribute('data-client-id', client.id); // Aggiungi questa riga

    document.getElementById('clientInitials').textContent = getInitials(client.nome, client.cognome);
    document.getElementById('clientFullName').textContent = `${client.nome} ${client.cognome}`;
    document.getElementById('clientEmail').textContent = client.email;
    document.getElementById('clientPhone').textContent = client.telefono;
    document.getElementById('clientObjective').textContent = client.obiettivo;
    document.getElementById('clientObjective').className = `client-objective tag-${client.obiettivo}`;
    
    document.getElementById('clientAge').textContent = calculateAge(client.dataNascita);
    document.getElementById('clientBirthday').textContent = formatDate(client.dataNascita);
    document.getElementById('clientObjectiveDetail').textContent = client.obiettivo;
    
    clientDetailsModal.classList.add('open');
    setupTabs();

    // Aggiungi l'evento al pulsante elimina
    const deleteBtn = document.querySelector('.btn-delete');
    if (deleteBtn) {
        deleteBtn.onclick = () => deleteClient(client.id);
    }

    // Aggiungi il caricamento delle schede
    loadClientWorkouts(client.id);
}

// Funzione per impostare le tab
function setupTabs() {
    const tabsNav = document.querySelectorAll('.tabs-nav li');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabsNav.forEach(tab => {
        tab.addEventListener('click', () => {
            // Rimuovi la classe active da tutte le tab
            tabsNav.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Aggiungi la classe active alla tab corrente
            tab.classList.add('active');
            
            // Mostra il contenuto della tab selezionata
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Funzione per caricare i clienti
function loadClients(clientsData) {
    // Rimuovi il messaggio di caricamento
    clientsGrid.innerHTML = '';
    console.log('DENTRO PRIMA LOADCLIENTS:', clientsData); // Debug
    if (clientsData.length === 0) {
        clientsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Nessun cliente trovato</p>
            </div>
        `;
        return;
    }
    
    // Crea le card per ogni cliente
    clientsData.forEach(client => {
        console.log('DENTRO LOADCLIENTS:', client); // Debug
        const card = createClientCard(client);
        clientsGrid.appendChild(card);
    });
}

// Evento di ricerca
searchInput.addEventListener('input', (e) => {
    const searchValue = e.target.value.toLowerCase();
    
    if (searchValue === '') {
        loadClients(clients);
        return;
    }
    
    const filteredClients = clients.filter(client => {
        const fullName = `${client.nome} ${client.cognome}`.toLowerCase();
        return fullName.includes(searchValue) || 
               client.email.toLowerCase().includes(searchValue) ||
               client.telefono.includes(searchValue);
    });
    
    loadClients(filteredClients);
});

// Evento per aprire il modal di aggiunta cliente
addClientBtn.addEventListener('click', () => {
    addClientForm.reset();
    addClientModal.classList.add('open');
});

// Eventi per chiudere il modal di aggiunta cliente
closeAddModal.addEventListener('click', () => {
    addClientModal.classList.remove('open');
});

cancelAddClient.addEventListener('click', () => {
    addClientModal.classList.remove('open');
});

// Evento per chiudere il modal di dettaglio cliente
closeDetailsModal.addEventListener('click', () => {
    clientDetailsModal.classList.remove('open');
});

// Aggiungi l'event listener per la chiusura del modal dettagli scheda
if (closeWorkoutModal) {
    closeWorkoutModal.addEventListener('click', () => {
        workoutDetailsModal.classList.remove('open');
    });
}

// Evento per aggiungere un nuovo cliente
addClientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Creiamo un FormData object con tutti i campi
    const formData = new FormData();
    formData.append('nome', document.getElementById('nome').value);
    formData.append('cognome', document.getElementById('cognome').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('telefono', document.getElementById('telefono').value);
    formData.append('dataNascita', document.getElementById('dataNascita').value);
    formData.append('obiettivo', document.getElementById('obiettivo').value);

    try {
        const response = await fetch('/register', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Errore durante la registrazione del cliente');
        }

        // Chiudi il modal
        addClientModal.classList.remove('open');
        
        // Pulisci il form
        addClientForm.reset();
        
        // Aggiungi il nuovo cliente alla lista e aggiorna la visualizzazione
        clients.push(data.client);
        loadClients(clients);
        
        // Mostra notifica di successo
        showNotification(data.message, 'success');
        
        setTimeout(() => {
            window.location.reload();
        }, 1); 
    
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message, 'error');
    }
    
});

// Chiudi i modal quando si clicca al di fuori
window.addEventListener('click', (e) => {
    if (e.target === addClientModal) {
        addClientModal.classList.remove('open');
    }
    
    if (e.target === clientDetailsModal) {
        clientDetailsModal.classList.remove('open');
    }

    if (e.target === workoutDetailsModal) {
        workoutDetailsModal.classList.remove('open');
    }
});

// Aggiunge la classe active al link corrispondente alla pagina corrente
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-menu li a');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.parentElement.classList.add('active');
        }
    });
});

// Inizializza l'applicazione
function init() {
    // Mostra il loading state
    clientsGrid.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Caricamento clienti...</span>
        </div>
    `;
    
    // Carica i clienti dall'API
    loadClientsFromAPI();
}

// Aggiungi questa funzione per gestire l'eliminazione
async function deleteClient(clientId) {
    if (!confirm('Sei sicuro di voler eliminare questo cliente? Questa azione non può essere annullata.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/client/${clientId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Importante per includere i cookie di sessione
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Errore durante l\'eliminazione');
        }
        
        // Chiudi il modal dei dettagli
        clientDetailsModal.classList.remove('open');
        
        // Ricarica la lista dei clienti
        await loadClientsFromAPI();
        
        // Mostra notifica di successo
        showNotification(data.message, 'success');
        
    } catch (error) {
        console.error('Errore:', error);
        showNotification(error.message, 'error');
    }
}

// Aggiungi la funzione per mostrare notifiche
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Rimuovi la notifica dopo 3 secondi
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Avvia l'applicazione quando il DOM è caricato
document.addEventListener('DOMContentLoaded', init);

async function loadObiettivi() {
    try {
        const response = await fetch('/api/obiettivi');
        if (!response.ok) {
            throw new Error('Errore nel caricamento degli obiettivi');
        }
        const obiettivi = await response.json();
        const obiettivoSelect = document.getElementById('obiettivo');

        // Svuota il select e aggiungi le opzioni
        obiettivoSelect.innerHTML = '<option value="">Seleziona un obiettivo</option>';
        obiettivi.forEach(obiettivo => {
            const option = document.createElement('option');
            option.value = obiettivo.id;
            option.textContent = obiettivo.nome;
            obiettivoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Errore:', error);
        alert('Impossibile caricare gli obiettivi. Riprova più tardi.');
    }
}

// Carica gli obiettivi quando la pagina è pronta
document.addEventListener('DOMContentLoaded', loadObiettivi);

// Aggiungi queste funzioni dopo la funzione showClientDetails

async function loadClientWorkouts(clientId) {
    try {
        const response = await fetch(`/api/client/${clientId}/schede`);
        if (!response.ok) {
            throw new Error('Errore nel caricamento delle schede');
        }
        
        const schede = await response.json();
        const programsList = document.querySelector('.programs-list');
        
        if (schede.length === 0) {
            programsList.innerHTML = `
                <div class="no-workouts">
                    <p>Nessun programma di allenamento presente</p>
                </div>
            `;
            return;
        }

        programsList.innerHTML = schede.map(scheda => `
            <div class="program-card" data-scheda-id="${scheda.id}">
                <div class="program-header">
                    <div class="program-info">
                        <h4>Scheda #${scheda.id}</h4>
                        <span class="program-date">
                            Creata: ${formatDate(scheda.data_creazione)}
                        </span>
                    </div>
                    <div class="program-stats">
                        <span class="exercise-count">
                            <i class="fas fa-dumbbell"></i> ${scheda.num_esercizi} esercizi
                        </span>
                        <span class="muscle-groups">
                            ${scheda.gruppi_muscolari.join(', ')}
                        </span>
                    </div>
                </div>
                <div class="program-actions">
                    <button class="btn-view" onclick="viewWorkoutDetails(${scheda.id})">
                        <i class="fas fa-eye"></i> Visualizza
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Errore:', error);
        showNotification('Errore nel caricamento delle schede', 'error');
    }
}

async function viewWorkoutDetails(schedaId) {
    try {
        const response = await fetch(`/api/schede/${schedaId}`);
        if (!response.ok) {
            throw new Error('Errore nel caricamento dei dettagli della scheda');
        }
        
        const scheda = await response.json();
        const modal = document.getElementById('workoutDetailsModal');
        const workoutTitle = document.getElementById('workoutTitle');
        const workoutDates = document.getElementById('workoutDates');
        const workoutExercises = document.querySelector('.workout-exercises');
        
        // Aggiungi l'ID della scheda al modal per riferimento futuro
        modal.dataset.schedaId = scheda.id;
        
        workoutTitle.textContent = `Scheda #${scheda.id}`;
        workoutDates.textContent = `Creata: ${formatDate(scheda.data_creazione)}`;
        
        // Aggiorna il contenuto degli esercizi
        workoutExercises.innerHTML = scheda.esercizi.map(esercizio => `
            <div class="exercise-item">
                <div class="exercise-header">
                    <h4>${esercizio.nome}</h4>
                    <span class="muscle-group">${esercizio.gruppo}</span>
                </div>
                <div class="exercise-details">
                    <span>Serie: ${esercizio.serie}</span>
                    <span>Ripetizioni: ${esercizio.ripetizioni}</span>
                    ${esercizio.peso_kg ? `<span>Peso: ${esercizio.peso_kg}kg</span>` : ''}
                    ${esercizio.recupero ? `<span>Recupero: ${esercizio.recupero}s</span>` : ''}
                </div>
            </div>
        `).join('');

        // Aggiorna i pulsanti di azione esistenti invece di crearne di nuovi
        const editButton = modal.querySelector('.btn-edit');
        const deleteButton = modal.querySelector('.btn-delete');
        
        if (editButton && deleteButton) {
            editButton.onclick = () => editWorkout(scheda.id);
            deleteButton.onclick = () => deleteWorkout(scheda.id);
        }
        
        modal.classList.add('open');
        
    } catch (error) {
        console.error('Errore:', error);
        showNotification('Errore nel caricamento dei dettagli della scheda', 'error');
    }
}

// Funzione per gestire la modifica della scheda
function editWorkout(schedaId) {
    window.location.href = `/modifica_scheda?id=${schedaId}`;
}

async function deleteWorkout() {
    const schedaId = document.querySelector('.workout-details').dataset.schedaId;
    
    if (!confirm('Sei sicuro di voler eliminare questa scheda?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/schede/${schedaId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Errore nell\'eliminazione della scheda');
        }
        
        // Chiudi il modal e ricarica le schede
        document.getElementById('workoutDetailsModal').classList.remove('open');
        const clientId = document.querySelector('.client-card.active').dataset.clientId;
        await loadClientWorkouts(clientId);
        
        showNotification('Scheda eliminata con successo', 'success');
        
    } catch (error) {
        console.error('Errore:', error);
        showNotification('Errore nell\'eliminazione della scheda', 'error');
    }
}

// Aggiungi questa funzione 
function createNewWorkout() {
    // Ottieni l'ID del cliente dai dettagli mostrati nel modal
    const clientId = document.getElementById('clientDetailsName')
        .getAttribute('data-client-id');
    
    if (!clientId) {
        showNotification('Errore: ID cliente non trovato', 'error');
        return;
    }

    // Reindirizza alla pagina di creazione scheda con l'ID del cliente
    window.location.href = `/creazione_scheda?id-cliente=${clientId}`;
}
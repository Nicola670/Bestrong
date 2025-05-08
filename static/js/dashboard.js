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

// Dati di esempio (simulazione API) Capitano aiutami tu
let clients = [
    {
        id: 1,
        nome: 'Marco',
        cognome: 'Bianchi',
        email: 'marco.bianchi@email.com',
        telefono: '333-1234567',
        dataNascita: '1990-05-15',
        obiettivo: 'dimagrimento',
        iscrizione: '2024-11-10',
        note: 'Cliente molto motivato. Preferisce allenamenti mattutini.',
    },
    {
        id: 2,
        nome: 'Laura',
        cognome: 'Rossi',
        email: 'laura.rossi@email.com',
        telefono: '333-7654321',
        dataNascita: '1988-09-22',
        obiettivo: 'tonificazione',
        iscrizione: '2024-12-05',
        note: 'Ha problemi alla schiena. Evitare esercizi con carico eccessivo sulla colonna.',
    },
    {
        id: 3,
        nome: 'Giovanni',
        cognome: 'Verdi',
        email: 'giovanni.verdi@email.com',
        telefono: '333-9876543',
        dataNascita: '1995-03-10',
        obiettivo: 'massa',
        iscrizione: '2025-01-15',
        note: 'Ex nuotatore agonistico. Ottima resistenza cardiovascolare.',
    },
    {
        id: 4,
        nome: 'Alessia',
        cognome: 'Ferrari',
        email: 'alessia.ferrari@email.com',
        telefono: '333-2468135',
        dataNascita: '1992-11-30',
        obiettivo: 'forza',
        iscrizione: '2024-10-20',
        note: 'Interessata ai corsi di kettlebell e allenamento funzionale.',
    },
    {
        id: 5,
        nome: 'Simone',
        cognome: 'Marino',
        email: 'simone.marino@email.com',
        telefono: '333-1357924',
        dataNascita: '1980-07-18',
        obiettivo: 'benessere',
        iscrizione: '2025-02-10',
        note: 'Prima esperienza in palestra. Necessita di un programma introduttivo.',
    },
];

// Funzione per ottenere le iniziali dal nome e cognome
function getInitials(nome, cognome) {
    return nome.charAt(0) + cognome.charAt(0);
}

// Funzione per creare una card cliente
function createClientCard(client) {
    const card = document.createElement('div');
    card.className = 'client-card';
    card.dataset.clientId = client.id;
    
    const initials = getInitials(client.nome, client.cognome);
    
    card.innerHTML = `
        <div class="client-avatar">
            <span>${initials}</span>
        </div>
        <div class="client-info">
            <h3>${client.nome} ${client.cognome}</h3>
            <p>${client.email}</p>
            <span class="client-tag tag-${client.obiettivo}">${formatObjective(client.obiettivo)}</span>
        </div>
    `;
    
    card.addEventListener('click', () => showClientDetails(client));
    
    return card;
}

// Funzione per formattare l'obiettivo
function formatObjective(objective) {
    const objectives = {
        'dimagrimento': 'Dimagrimento',
        'tonificazione': 'Tonificazione',
        'massa': 'Massa muscolare',
        'forza': 'Forza',
        'benessere': 'Benessere'
    };
    
    return objectives[objective] || objective;
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
    // Aggiorna i dati nel modal
    document.getElementById('clientDetailsName').textContent = `Dettagli Cliente`;
    document.getElementById('clientInitials').textContent = getInitials(client.nome, client.cognome);
    document.getElementById('clientFullName').textContent = `${client.nome} ${client.cognome}`;
    document.getElementById('clientEmail').textContent = client.email;
    document.getElementById('clientPhone').textContent = client.telefono;
    document.getElementById('clientObjective').textContent = formatObjective(client.obiettivo);
    document.getElementById('clientObjective').className = `client-objective tag-${client.obiettivo}`;
    
    // Info tab
    document.getElementById('clientAge').textContent = calculateAge(client.dataNascita);
    document.getElementById('clientBirthday').textContent = formatDate(client.dataNascita);
    document.getElementById('clientMembership').textContent = formatDate(client.iscrizione);
    document.getElementById('clientObjectiveDetail').textContent = formatObjective(client.obiettivo);
    
    document.getElementById('link-neworkout').href = `creazione_scheda.html`;

    // Note tab
    document.getElementById('clientNotes').value = client.note || '';
    
    // Mostra il modal
    clientDetailsModal.classList.add('open');
    
    // Gestione delle tab
    setupTabs();
}

//funzione per ricevere id del cliente
function getClientId(client){
    
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

// Evento per aggiungere un nuovo cliente
addClientForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Ottieni i dati dal form
    const newClient = {
        id: clients.length + 1,
        nome: document.getElementById('nome').value,
        cognome: document.getElementById('cognome').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        dataNascita: document.getElementById('dataNascita').value,
        obiettivo: document.getElementById('obiettivo').value,
        iscrizione: new Date().toISOString().split('T')[0],
    };
    
    // Aggiungi il nuovo cliente all'array
    clients.push(newClient);
    
    // Aggiorna la griglia
    loadClients(clients);
    
    // Chiudi il modal
    addClientModal.classList.remove('open');
    
    // Mostra un messaggio di successo
    showNotification('Cliente aggiunto con successo!');
});

// Chiudi i modal quando si clicca al di fuori
window.addEventListener('click', (e) => {
    if (e.target === addClientModal) {
        addClientModal.classList.remove('open');
    }
    
    if (e.target === clientDetailsModal) {
        clientDetailsModal.classList.remove('open');
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
    // Simula il caricamento dei dati dall'API
    setTimeout(() => {
        loadClients(clients);
    }, 1000);
}

// Avvia l'applicazione
init();
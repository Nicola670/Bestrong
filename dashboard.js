//elementi del DOM
const clientsGrid = document.getElementById('clientsGrid');
const addClientBtn = document.getElementById('addClientBtn');
const addClientModal = document.getElementById('addClientModal');
const closeAddModal = document.getElementById('closeAddModal');
const cancelAddClient = document.getElementById('cancelAddClient');
const addClientForm = document.getElementById('addClientForm');
const clientDetailsModal = document.getElementById('clientDetailsModal');
const closeDetailsModal = document.getElementById('closeDetailsModal');
const searchInput = document.getElementById('searchInput');

//funzione per ottenere le iniziali di nome e cognome
function getInitials(nome, cognome){
    return nome.charAt(0) + cognome.charAt(0);
}

//funzione per creare la card dell'utente
function createClientCard(client){
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

//funzione per formattare l'obbiettivo
function formatObjective(objective){
    const objectives = {
        'dimagrimento': 'Dimagrimento',
        'tonificazione': 'Tonificazione',
        'massa': 'Massa muscolare',
        'forza': 'Forza',
        'benessere': 'Benessere'
    };
    
    return objectives[objective] || objective;
}

//funzione per calcolare l'eta
function calculateAge(birthDate){
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

//funzione per formattare la data
function formatDate(dateString){
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

//funzione per mostrare i dettagli di un cliente
function showClientDetail(client){

}

// Funzione per impostare le tab
function setupTabs(){

}

// Funzione per caricare i clienti
function loadClients(clientsData){

}
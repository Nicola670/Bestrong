document.addEventListener('DOMContentLoaded', function() {
    // Gestione delle schede
    const cards = document.querySelectorAll('.client-card');
    const modal = document.getElementById('schedaDetailsModal');
    const closeModalBtn = document.getElementById('closeModal');
    
    // Apri modal quando si clicca su una scheda
    cards.forEach(card => {
        card.addEventListener('click', function() {
            // Ottieni i dati della scheda e aggiorna il contenuto del modal
            const cardTitle = this.querySelector('h3').textContent;
            const cardDesc = this.querySelector('p').textContent;
            
            // Aggiorna il titolo del modal
            document.querySelector('.modal-header h2').textContent = 'Scheda: ' + cardTitle;
            
            // Genera contenuto dinamico per il corpo del modal
            let modalContent = `
                <h3>${cardTitle}</h3>
                <p>${cardDesc}</p>
                <div class="esercizi-list">
                    <h4>Esercizi:</h4>
                    <ul>
                        <li>Esercizio 1: 3 serie x 12 ripetizioni</li>
                        <li>Esercizio 2: 4 serie x 10 ripetizioni</li>
                        <li>Esercizio 3: 3 serie x 15 ripetizioni</li>
                        <li>Esercizio 4: 3 serie x 12 ripetizioni</li>
                    </ul>
                </div>
            `;
            
            // Aggiorna il contenuto del modal
            document.querySelector('.modal-body').innerHTML = modalContent;
            
            // Apri il modal
            modal.classList.add('open');
        });
    });
    
    // Chiudi modal quando si clicca sul pulsante di chiusura
    closeModalBtn.addEventListener('click', function() {
        modal.classList.remove('open');
    });
    
    // Chiudi modal quando si clicca fuori dal contenuto
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.classList.remove('open');
        }
    });

    // Gestione della sidebar
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    // Funzione per controllare la dimensione dello schermo e adattare la UI
    function checkScreenSize() {
        if (window.innerWidth <= 1024) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
        }
    }
    
    // Controlla la dimensione dello schermo all'avvio
    checkScreenSize();
    
    // Controlla la dimensione dello schermo quando viene ridimensionata la finestra
    window.addEventListener('resize', checkScreenSize);
    
    // Toggle della sidebar quando si fa clic sul pulsante del menu
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    });
    
    // Chiudi la sidebar quando si fa clic su un link su schermi piccoli
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('expanded');
            }
        });
    });

    // Funzionalità di ricerca
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keyup', function() {
        const searchTerm = this.value.toLowerCase();
        const schede = document.querySelectorAll('.client-card');
        
        schede.forEach(scheda => {
            const titolo = scheda.querySelector('h3').textContent.toLowerCase();
            const descrizione = scheda.querySelector('p').textContent.toLowerCase();
            
            if (titolo.includes(searchTerm) || descrizione.includes(searchTerm)) {
                scheda.style.display = '';
            } else {
                scheda.style.display = 'none';
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-menu li a');
    
    navLinks.forEach(link => {
        // Rimuove la classe active da tutti i link
        link.parentElement.classList.remove('active');
        // Aggiunge la classe active solo al link corrente
        if (link.getAttribute('href') === currentPath) {
            link.parentElement.classList.add('active');
        }
    });
});

// Variabili globali
let schedaDetailsModal;
let schedeGrid;
let currentUser;

// Carica i dati dell'utente corrente
async function loadCurrentUser() {
    try {
        const response = await fetch('/api/current-user', {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Errore nel caricamento dati utente');
        
        currentUser = await response.json();
        
        // Aggiorna la sidebar con i dati dell'utente
        updateUserProfile(currentUser);
        
    } catch (error) {
        console.error('Errore:', error);
        showNotification('Errore nel caricamento dati utente', 'error');
    }
}

// Aggiorna il profilo utente nella sidebar
function updateUserProfile(user) {
    const userInitials = document.querySelector('.avatar span');
    const userName = document.querySelector('.trainer-info h4');
    const userRole = document.querySelector('.trainer-info p');
    
    if (userInitials) userInitials.textContent = getInitials(user.nome, user.cognome);
    if (userName) userName.textContent = `${user.nome} ${user.cognome}`;
    if (userRole) userRole.textContent = 'Cliente';
}

// Carica le schede dell'utente corrente
async function loadSchedeFromAPI() {
    try {
        const response = await fetch(`/api/client/${currentUser.id}/schede`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Errore nel caricamento delle schede');
        }
        
        const schede = await response.json();
        
        // Se non ci sono schede, mostra un messaggio appropriato
        if (schede.length === 0) {
            document.getElementById('schedeGrid').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-dumbbell"></i>
                    <p>Non hai ancora nessuna scheda assegnata</p>
                </div>
            `;
            return;
        }
        
        displaySchede(schede);
        
    } catch (error) {
        console.error('Errore:', error);
        document.getElementById('schedeGrid').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <span>${error.message}</span>
            </div>
        `;
    }
}

// Visualizza le schede nella griglia
function displaySchede(schede) {
    const schedeGrid = document.getElementById('schedeGrid');
    schedeGrid.innerHTML = '';
    
    if (!schede || schede.length === 0) {
        schedeGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-dumbbell"></i>
                <p>Non hai ancora nessuna scheda assegnata</p>
            </div>
        `;
        return;
    }

    // Mappa dei colori e icone per gruppo muscolare
    const groupStyles = {
        'Pettorali': { gradient: 'linear-gradient(135deg, #e74c3c, #c0392b)', icon: 'fa-dumbbell' },
        'Dorsali': { gradient: 'linear-gradient(135deg, #3498db, #2980b9)', icon: 'fa-running' },
        'Quadricipiti': { gradient: 'linear-gradient(135deg, #9b59b6, #8e44ad)', icon: 'fa-walking' },
        'Bicipiti': { gradient: 'linear-gradient(135deg, #f1c40f, #f39c12)', icon: 'fa-hand-rock' },
        'Addominali': { gradient: 'linear-gradient(135deg, #2ecc71, #27ae60)', icon: 'fa-child' },
        'Generale': { gradient: 'linear-gradient(135deg, #95a5a6, #7f8c8d)', icon: 'fa-dumbbell' }
    };

    schede.forEach(scheda => {
        const mainGroup = scheda.gruppi_muscolari && scheda.gruppi_muscolari.length > 0 
            ? scheda.gruppi_muscolari[0] 
            : 'Generale';
            
        const style = groupStyles[mainGroup] || groupStyles['Generale'];

        const schedaEl = document.createElement('div');
        schedaEl.className = 'client-card';
        schedaEl.innerHTML = `
            <div class="client-avatar" style="background: ${style.gradient}">
                <i class="fas ${style.icon}"></i>
            </div>
            <div class="client-info">
                <h3>${mainGroup}</h3>
                <p>${scheda.esercizi.map(es => es.nome).slice(0, 2).join(', ')}${scheda.esercizi.length > 2 ? '...' : ''}</p>
                <div class="creation-date">
                    <i class="far fa-calendar-alt"></i>
                    <span>Creata il ${new Date(scheda.data_creazione).toLocaleDateString()}</span>
                </div>
                <span class="client-tag tag-bottone">
                    ${scheda.num_esercizi} esercizi - Vedi dettagli
                </span>
            </div>
        `;
        
        schedaEl.addEventListener('click', () => {
            showSchedaDetails(scheda);
        });
        
        schedeGrid.appendChild(schedaEl);
    });
}

// Mostra i dettagli della scheda nel modal
function showSchedaDetails(scheda) {
    const mainGroup = scheda.gruppi_muscolari && scheda.gruppi_muscolari.length > 0 
        ? scheda.gruppi_muscolari[0] 
        : 'Generale';
    const modalBody = document.querySelector('.modal-body');
    modalBody.innerHTML = `
        <h3>${mainGroup}</h3>
        <div class="esercizi-list">
            <h4>Esercizi:</h4>
            <ul>
                ${scheda.esercizi.map(es => `
                    <li>
                        <strong>${es.nome}</strong>
                        <p>Serie: ${es.serie} x Ripetizioni: ${es.ripetizioni}</p>
                        ${es.peso_kg ? `<p>Peso: ${es.peso_kg}kg</p>` : ''}
                        ${es.recupero_secondi ? `<p>Recupero: ${es.recupero_secondi}s</p>` : ''}
                        ${es.note ? `<p>Note: ${es.note}</p>` : ''}
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
    
    schedaDetailsModal.classList.add('open');
}

// Utility Functions
function getInitials(nome, cognome) {
    return (nome ? nome[0] : '') + (cognome ? cognome[0] : '');
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    schedaDetailsModal = document.getElementById('schedaDetailsModal');
    schedeGrid = document.getElementById('schedeGrid');
    
    try {
        // Prima carica i dati dell'utente
        await loadCurrentUser();
        // Poi carica le schede
        if (currentUser && currentUser.id) {
            await loadSchedeFromAPI();
        } else {
            throw new Error('Utente non autenticato');
        }
    } catch (error) {
        console.error('Errore durante il caricamento:', error);
        showNotification('Errore durante il caricamento dei dati', 'error');
    }
    
    // Eventi per il modal
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            schedaDetailsModal.classList.remove('open');
        });
    }
    
    // Click fuori dal modal per chiudere
    window.addEventListener('click', (e) => {
        if (e.target === schedaDetailsModal) {
            schedaDetailsModal.classList.remove('open');
        }
    });
    
    // Gestione ricerca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase();
            const cards = document.querySelectorAll('.client-card');
            
            cards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const desc = card.querySelector('p').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || desc.includes(searchTerm)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
});
// Toggle Sidebar
    document.getElementById('menuToggle').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('collapsed');
        document.getElementById('mainContent').classList.toggle('expanded');
    });
    
    // Search Functionality
    document.getElementById('searchInput').addEventListener('keyup', function() {
        const searchTerm = this.value.toLowerCase();
        const teamCards = document.querySelectorAll('.team-card');
        
        teamCards.forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            const role = card.querySelector('.team-role').textContent.toLowerCase();
            const desc = card.querySelector('.team-desc').textContent.toLowerCase();
            
            if (name.includes(searchTerm) || role.includes(searchTerm) || desc.includes(searchTerm)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });

// Funzione per ottenere le iniziali dal nome completo
function getInitials(nome, cognome) {
    return (nome ? nome[0] : '') + (cognome ? cognome[0] : '');
}

// Funzione per caricare i dati dell'utente
async function loadUserData() {
    try {
        const response = await fetch('/api/current-user', {
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Errore nel caricamento dei dati utente');
        }
        
        const userData = await response.json();
        
        if (!userData) {
            throw new Error('Dati utente non validi');
        }
        
        // Aggiorna le iniziali
        const userInitialsElement = document.getElementById('userInitials');
        if (userInitialsElement) {
            userInitialsElement.textContent = getInitials(userData.nome, userData.cognome);
        }
        
        // Aggiorna il nome completo
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = `${userData.nome} ${userData.cognome}`;
        }
        
        // Aggiorna il ruolo
        const userRoleElement = document.getElementById('userRole');
        if (userRoleElement) {
            userRoleElement.textContent = userData.is_trainer ? 'Trainer' : 'Cliente';
        }
        
    } catch (error) {
        console.error('Errore nel caricamento dei dati utente:', error);
        // Mostra un messaggio di errore all'utente
        const errorMessage = 'Errore nel caricamento dei dati. Riprova più tardi.';
        document.getElementById('userName').textContent = errorMessage;
        document.getElementById('userRole').textContent = 'Errore';
    }
}

// Assicurati che il caricamento avvenga dopo che il DOM è pronto
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

    loadUserData();
});
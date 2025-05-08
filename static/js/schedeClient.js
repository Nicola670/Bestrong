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


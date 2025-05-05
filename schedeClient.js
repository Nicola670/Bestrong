// Script per il menu a tendina
let sidebar = document.querySelector(".sidebar");
let closeBtn = document.querySelector("#btn");
closeBtn.addEventListener("click", ()=>{
    sidebar.classList.toggle("open");
});

document.addEventListener('DOMContentLoaded', function() {
    // Gestione delle schede
    const cards = document.querySelectorAll('.client-card');
    
    cards.forEach(card => {
        card.addEventListener('click', function() {
            document.getElementById('schedaDetailsModal').classList.add('open');
        });
    });
    
    document.querySelector('.close-modal').addEventListener('click', function() {
        document.getElementById('schedaDetailsModal').classList.remove('open');
    });

    // Gestione della sidebar
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    // Chiudi la sidebar all'inizio su schermi piccoli
    function checkScreenSize() {
        if (window.innerWidth <= 1024) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        }
    }
    
    // Controlla la dimensione dello schermo quando si carica la pagina
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
});
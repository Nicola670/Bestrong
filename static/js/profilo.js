document.addEventListener('DOMContentLoaded', function() {
    // Elementi UI principali
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelEditBtn = document.getElementById('cancelEdit');
    const profileForm = document.getElementById('profileForm');
    const changePhotoBtn = document.querySelector('.change-photo-btn');
    const imageUploadOverlay = document.querySelector('.image-upload-overlay');
    
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

    // Mostra il modal per la modifica del profilo
    editProfileBtn.addEventListener('click', function() {
        editProfileModal.classList.add('open');
    });
    
    // Chiudi modal quando si clicca sul pulsante di chiusura
    closeModalBtn.addEventListener('click', function() {
        editProfileModal.classList.remove('open');
    });
    
    // Chiudi modal quando si clicca sul pulsante Annulla
    cancelEditBtn.addEventListener('click', function() {
        editProfileModal.classList.remove('open');
    });
    
    // Chiudi modal quando si clicca fuori dal contenuto
    editProfileModal.addEventListener('click', function(event) {
        if (event.target === editProfileModal) {
            editProfileModal.classList.remove('open');
        }
    });
    
    // Gestisci l'invio del form di modifica profilo
    profileForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Raccogli i dati dal form
        const formData = {
            nome: document.getElementById('nome').value,
            cognome: document.getElementById('cognome').value,
            dataNascita: document.getElementById('dataNascita').value,
            sesso: document.getElementById('sesso').value,
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value,
            altezza: document.getElementById('altezza').value,
            peso: document.getElementById('peso').value,
            obiettivo: document.getElementById('obiettivo').value
        };
        
        // In un'applicazione reale, qui invieresti i dati a un server
        console.log('Dati del profilo aggiornati:', formData);
        
        // Aggiorna l'interfaccia utente con i nuovi dati
        updateProfileUI(formData);
        
        // Chiudi il modal
        editProfileModal.classList.remove('open');
        
        // Mostra messaggio di conferma
        showNotification('Profilo aggiornato con successo!');
    });
    
    // Funzione per aggiornare l'UI del profilo con i nuovi dati
    function updateProfileUI(data) {
        // Aggiorna le informazioni visualizzate nel profilo
        document.querySelector('.info-value:nth-of-type(1)').textContent = data.nome;
        document.querySelector('.info-row:nth-of-type(2) .info-value').textContent = data.cognome;
        
        // Formatta la data nel formato italiano (GG/MM/AAAA)
        const date = new Date(data.dataNascita);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        document.querySelector('.info-row:nth-of-type(3) .info-value').textContent = formattedDate;
        
        // Aggiorna il sesso
        let sessoText = 'Altro';
        if (data.sesso === 'maschio') sessoText = 'Maschio';
        if (data.sesso === 'femmina') sessoText = 'Femmina';
        document.querySelector('.info-row:nth-of-type(4) .info-value').textContent = sessoText;
        
        // Aggiorna email e telefono
        const infoRows = document.querySelectorAll('.info-group:nth-of-type(2) .info-row');
        infoRows[0].querySelector('.info-value').textContent = data.email;
        infoRows[1].querySelector('.info-value').textContent = data.telefono;
        
        // Aggiorna i dati fitness
        const fitnessRows = document.querySelectorAll('.info-group:nth-of-type(3) .info-row');
        fitnessRows[0].querySelector('.info-value').textContent = `${data.altezza} cm`;
        fitnessRows[1].querySelector('.info-value').textContent = `${data.peso} kg`;
        
        // Aggiorna l'obiettivo
        let obiettivoText = '';
        switch(data.obiettivo) {
            case 'massa':
                obiettivoText = 'Aumento massa muscolare';
                break;
            case 'dimagrimento':
                obiettivoText = 'Dimagrimento';
                break;
            case 'definizione':
                obiettivoText = 'Definizione muscolare';
                break;
            case 'forza':
                obiettivoText = 'Aumento della forza';
                break;
            case 'resistenza':
                obiettivoText = 'Miglioramento resistenza';
                break;
        }
        fitnessRows[2].querySelector('.info-value').textContent = obiettivoText;
        
        // Aggiorna le iniziali nell'avatar se è cambiato il nome
        const initials = `${data.nome.charAt(0)}${data.cognome.charAt(0)}`;
        document.querySelector('.profile-image').textContent = initials;
        document.querySelector('.avatar span').textContent = initials;
        document.querySelector('.trainer-info h4').textContent = `${data.nome} ${data.cognome}`;
    }
    
    // Simulazione del caricamento di una nuova foto
    function simulatePhotoUpload() {
        // In un'applicazione reale, qui avresti un input di tipo file e gestiresti il caricamento
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        
        fileInput.click();
        
        fileInput.addEventListener('change', function() {
            if (fileInput.files && fileInput.files[0]) {
                // Simula un ritardo di caricamento
                showNotification('Caricamento immagine in corso...');
                
                setTimeout(() => {
                    showNotification('Immagine caricata con successo!');
                }, 1500);
            }
        });
    }
    
    // Gestisci il click sul pulsante di cambio foto
    changePhotoBtn.addEventListener('click', simulatePhotoUpload);
    imageUploadOverlay.addEventListener('click', simulatePhotoUpload);
    
    // Funzione per mostrare notifiche
    function showNotification(message) {
        // Crea un elemento per la notifica
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Stili per la notifica
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = 'var(--success-color)';
        notification.style.color = 'white';
        notification.style.padding = '12px 20px';
        notification.style.borderRadius = 'var(--border-radius)';
        notification.style.boxShadow = 'var(--shadow-lg)';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.zIndex = '1000';
        notification.style.animation = 'fadeInUp 0.3s ease forwards';
        
        // Aggiungi stili per l'animazione
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes fadeOut {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .notification-content i {
                font-size: 1.2rem;
            }
        `;
        document.head.appendChild(style);
        
        // Aggiungi la notifica al body
        document.body.appendChild(notification);
        
        // Rimuovi la notifica dopo 3 secondi
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
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
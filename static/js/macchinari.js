// Array di macchinari demo per il prototipo
let machines = [];

// Funzione per caricare i dati dal server
async function loadMachines() {
    try {
        const response = await fetch('/api/machines');
        if (!response.ok) throw new Error('Errore nel caricamento dei macchinari');
        machines = await response.json();
        populateMachinesGrid();
    } catch (error) {
        console.error('Errore:', error);
        document.getElementById('machinesGrid').innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-circle"></i>
                <span>Errore nel caricamento dei macchinari</span>
            </div>
        `;
    }
}

// Funzione per generare l'HTML della card di un macchinario
function generateMachineCard(machine) {
    const initials = machine.nome.split(' ').map(word => word[0]).join('');
    
    return `
        <div class="client-card" data-id="${machine.id}">
            <div class="client-avatar">
                <span>${initials}</span>
            </div>
            <div class="client-info">
                <h3>${machine.nome}</h3>
            </div>
        </div>
    `;
}

// Funzione per aggiungere un nuovo macchinario
async function addNewMachine(event) {
    event.preventDefault();
    
    const nome = document.getElementById('nome').value;
    
    try {
        const response = await fetch('/api/machines', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nome })
        });

        if (!response.ok) throw new Error('Errore nell\'aggiunta del macchinario');

        await loadMachines();
        closeAddMachineModal();
        alert("Macchinario aggiunto con successo!");
    } catch (error) {
        console.error('Errore:', error);
        alert("Errore durante l'aggiunta del macchinario");
    }
}

// Funzione per eliminare un macchinario
async function deleteMachine() {
    const machineId = parseInt(document.getElementById('machineDetailsModal').getAttribute('data-machine-id'));
    
    if (confirm("Sei sicuro di voler eliminare questo macchinario?")) {
        try {
            const response = await fetch(`/api/machines/${machineId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Errore nella cancellazione del macchinario');

            await loadMachines();
            closeMachineDetailsModal();
            alert("Macchinario eliminato con successo!");
        } catch (error) {
            console.error('Errore:', error);
            alert("Errore durante l'eliminazione del macchinario");
        }
    }
}

// Funzione per aprire i dettagli di un macchinario
function openMachineDetails(machineId) {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;
    
    document.getElementById('machineDetailsName').textContent = `Dettagli: ${machine.nome}`;
    document.getElementById('machineFullName').textContent = machine.nome;
    
    document.getElementById('machineIcon').innerHTML = `<i class="fas fa-dumbbell"></i>`;
    
    document.getElementById('machineDetailsModal').setAttribute('data-machine-id', machineId);
    document.getElementById('machineDetailsModal').classList.add('open');
}

// Funzione per filtrare i macchinari
function searchMachines(query) {
    if (!query) {
        populateMachinesGrid();
        return;
    }
    
    query = query.toLowerCase();
    const filteredMachines = machines.filter(machine => 
        machine.nome.toLowerCase().includes(query)
    );
    
    populateMachinesGrid(filteredMachines);
}

// Funzione per gestire il toggle della sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

// Funzione per gestire i tab nelle schede dettaglio
function setupTabs() {
    document.querySelectorAll('.tabs-nav li').forEach(tab => {
        tab.addEventListener('click', function() {
            // Rimuovi la classe active da tutti i tab
            document.querySelectorAll('.tabs-nav li').forEach(t => t.classList.remove('active'));
            
            // Aggiungi la classe active al tab cliccato
            this.classList.add('active');
            
            // Nascondi tutti i contenuti dei tab
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Mostra il contenuto del tab selezionato
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    loadMachines();
    setupTabs();
    
    // Event listeners
    document.getElementById('menuToggle').addEventListener('click', toggleSidebar);
    document.getElementById('addMachineBtn').addEventListener('click', openAddMachineModal);
    document.getElementById('closeAddModal').addEventListener('click', closeAddMachineModal);
    document.getElementById('cancelAddMachine').addEventListener('click', closeAddMachineModal);
    document.getElementById('addMachineForm').addEventListener('submit', addNewMachine);
    document.getElementById('closeDetailsModal').addEventListener('click', closeMachineDetailsModal);
    document.getElementById('deleteMachineBtn').addEventListener('click', deleteMachine);
    document.getElementById('searchInput').addEventListener('input', function() {
        searchMachines(this.value);
    });
});

// Aggiunge la classe active al link corrispondente alla pagina corrente
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-menu li a');
    const sidebar = document.getElementById('sidebar');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.parentElement.classList.add('active');
        }
    });

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // Chiudi il menu quando si clicca fuori
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 768) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.add('collapsed');
            }
        }
    });
});
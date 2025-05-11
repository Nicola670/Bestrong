// Array di macchinari demo per il prototipo
let machines = [
    {
        id: 1,
        nome: "Leg Press",
        tipologia: "forza",
        parteCorpo: "gambe",
        note: "Macchina molto utilizzata, verificare usura cavi ogni 3 mesi."
    },
    {
        id: 2,
        nome: "Tapis Roulant",
        tipologia: "cardio",
        parteCorpo: "total",
        note: "Utilizzato principalmente nelle ore mattutine, monitorare il motore."
    },
    {
        id: 3,
        nome: "Chest Press",
        tipologia: "isotonica",
        parteCorpo: "petto",
        note: "Presenta rumore anomalo durante l'utilizzo, da controllare."
    },
    {
        id: 4,
        nome: "Lat Machine",
        tipologia: "isotonica",
        parteCorpo: "schiena",
        note: ""
    },
    {
        id: 5,
        nome: "Shoulder Press",
        tipologia: "forza",
        parteCorpo: "spalle",
        note: "Preferito dagli utenti esperti, molto stabile."
    },
    {
        id: 6,
        nome: "Cyclette",
        tipologia: "cardio",
        parteCorpo: "total",
        note: "Ideale per riscaldamento, molto silenziosa."
    },
    {
        id: 7,
        nome: "TRX",
        tipologia: "funzionale",
        parteCorpo: "total",
        note: "Controllare periodicamente l'usura delle cinghie."
    },
    {
        id: 8,
        nome: "Curl Machine",
        tipologia: "isotonica",
        parteCorpo: "braccia",
        note: ""
    }
];

// Funzione per salvare i dati nel localStorage
function saveMachines() {
    localStorage.setItem('machines', JSON.stringify(machines));
}

// Funzione per caricare i dati dal localStorage
function loadMachines() {
    const savedMachines = localStorage.getItem('machines');
    if (savedMachines) {
        machines = JSON.parse(savedMachines);
    }
}

// Funzione per generare l'HTML della card di un macchinario
function generateMachineCard(machine) {
    // Ottiene le prime lettere del nome del macchinario per l'avatar
    const initials = machine.nome.split(' ').map(word => word[0]).join('');
    
    return `
        <div class="client-card" data-id="${machine.id}">
            <div class="client-avatar">
                <span>${initials}</span>
            </div>
            <div class="client-info">
                <h3>${machine.nome}</h3>
                <span class="client-tag tag-${machine.tipologia}">${capitalizeFirstLetter(machine.tipologia)}</span>
                <span class="client-tag tag-${machine.parteCorpo}">${capitalizeFirstLetter(machine.parteCorpo)}</span>
            </div>
        </div>
    `;
}

// Funzione per rendere maiuscola la prima lettera
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Funzione per popolare la griglia dei macchinari
function populateMachinesGrid(machinesList = machines) {
    const machinesGrid = document.getElementById('machinesGrid');
    
    // Rimuovi il loader
    machinesGrid.innerHTML = '';
    
    if (machinesList.length === 0) {
        machinesGrid.innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-circle"></i>
                <span>Nessun macchinario trovato</span>
            </div>
        `;
        return;
    }
    
    // Aggiungi le card dei clienti
    machinesList.forEach(machine => {
        machinesGrid.innerHTML += generateMachineCard(machine);
    });
    
    // Aggiungi event listener alle card
    document.querySelectorAll('.client-card').forEach(card => {
        card.addEventListener('click', function() {
            const machineId = parseInt(this.getAttribute('data-id'));
            openMachineDetails(machineId);
        });
    });
}

// Funzione per aprire i dettagli di un macchinario
function openMachineDetails(machineId) {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;
    
    // Popola i dettagli nel modal
    document.getElementById('machineDetailsName').textContent = `Dettagli: ${machine.nome}`;
    document.getElementById('machineFullName').textContent = machine.nome;
    document.getElementById('machineBodyPart').textContent = capitalizeFirstLetter(machine.parteCorpo);
    document.getElementById('machineType').textContent = capitalizeFirstLetter(machine.tipologia);
    document.getElementById('machineBodyPartDetail').textContent = capitalizeFirstLetter(machine.parteCorpo);
    document.getElementById('machineNotes').value = machine.note || '';
    
    // Gestione icona in base alla tipologia
    let iconClass = 'fa-dumbbell';
    if (machine.tipologia === 'cardio') iconClass = 'fa-running';
    else if (machine.tipologia === 'funzionale') iconClass = 'fa-users';
    
    document.getElementById('machineIcon').innerHTML = `<i class="fas ${iconClass}"></i>`;
    
    // Salva l'ID del macchinario corrente per operazioni successive
    document.getElementById('machineDetailsModal').setAttribute('data-machine-id', machineId);
    
    // Apri il modal
    document.getElementById('machineDetailsModal').classList.add('open');
}

// Funzione per chiudere il modal dei dettagli
function closeMachineDetailsModal() {
    document.getElementById('machineDetailsModal').classList.remove('open');
}

// Funzione per aprire il modal di aggiunta macchinario
function openAddMachineModal() {
    // Resetta il form
    document.getElementById('addMachineForm').reset();
    
    // Apri il modal
    document.getElementById('addMachineModal').classList.add('open');
}

// Funzione per chiudere il modal di aggiunta macchinario
function closeAddMachineModal() {
    document.getElementById('addMachineModal').classList.remove('open');
}

// Funzione per aggiungere un nuovo macchinario
function addNewMachine(event) {
    event.preventDefault();
    
    // Raccogli i dati dal form
    const nome = document.getElementById('nome').value;
    const tipologia = document.getElementById('tipologia').value;
    const parteCorpo = document.getElementById('parteCorpo').value;
    
    // Genera un nuovo ID incrementale
    const newId = machines.length > 0 ? Math.max(...machines.map(m => m.id)) + 1 : 1;
    
    // Crea il nuovo oggetto macchinario
    const newMachine = {
        id: newId,
        nome: nome,
        tipologia: tipologia,
        parteCorpo: parteCorpo,
        note: ""
    };
    
    // Aggiungi il macchinario all'array
    machines.push(newMachine);
    
    // Salva i dati
    saveMachines();
    
    // Aggiorna la griglia e chiudi il modal
    populateMachinesGrid();
    closeAddMachineModal();
    
    // Mostra un messaggio di conferma
    alert("Macchinario aggiunto con successo!");
}

// Funzione per eliminare un macchinario
function deleteMachine() {
    const machineId = parseInt(document.getElementById('machineDetailsModal').getAttribute('data-machine-id'));
    
    if (confirm("Sei sicuro di voler eliminare questo macchinario?")) {
        // Trova l'indice del macchinario nell'array
        const index = machines.findIndex(m => m.id === machineId);
        
        if (index !== -1) {
            // Rimuovi il macchinario dall'array
            machines.splice(index, 1);
            
            // Salva i dati
            saveMachines();
            
            // Aggiorna la griglia e chiudi il modal
            populateMachinesGrid();
            closeMachineDetailsModal();
            
            // Mostra un messaggio di conferma
            alert("Macchinario eliminato con successo!");
        }
    }
}

// Funzione per salvare le note di un macchinario
function saveMachineNotes() {
    const machineId = parseInt(document.getElementById('machineDetailsModal').getAttribute('data-machine-id'));
    const notes = document.getElementById('machineNotes').value;
    
    // Trova l'indice del macchinario nell'array
    const index = machines.findIndex(m => m.id === machineId);
    
    if (index !== -1) {
        // Aggiorna le note
        machines[index].note = notes;
        
        // Salva i dati
        saveMachines();
        
        // Mostra un messaggio di conferma
        alert("Note salvate con successo!");
    }
}

// Funzione per modificare un macchinario
function editMachine() {
    const machineId = parseInt(document.getElementById('machineDetailsModal').getAttribute('data-machine-id'));
    const machine = machines.find(m => m.id === machineId);
    
    if (!machine) return;
    
    // Richiedi i nuovi dati (in un'app reale useresti un form)
    const nome = prompt("Nome macchinario:", machine.nome);
    if (nome === null) return;
    
    // Trova l'indice del macchinario nell'array
    const index = machines.findIndex(m => m.id === machineId);
    
    if (index !== -1) {
        // Aggiorna le informazioni
        machines[index].nome = nome;
        
        // Salva i dati
        saveMachines();
        
        // Chiudi il modal dei dettagli
        closeMachineDetailsModal();
        
        // Aggiorna la griglia
        populateMachinesGrid();
        
        // Mostra un messaggio di conferma
        alert("Macchinario aggiornato con successo!");
    }
}

// Funzione per filtrare i macchinari in base alla ricerca
function searchMachines(query) {
    if (!query) {
        populateMachinesGrid();
        return;
    }
    
    query = query.toLowerCase();
    
    const filteredMachines = machines.filter(machine => 
        machine.nome.toLowerCase().includes(query) ||
        machine.tipologia.toLowerCase().includes(query) ||
        machine.parteCorpo.toLowerCase().includes(query)
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
    // Carica i dati dal localStorage
    loadMachines();
    
    // Popola la griglia dei macchinari
    populateMachinesGrid();
    
    // Setup dei tab
    setupTabs();
    
    // Event listener per il toggle della sidebar
    document.getElementById('menuToggle').addEventListener('click', toggleSidebar);
    
    // Event listener per aprire il modal di aggiunta macchinario
    document.getElementById('addMachineBtn').addEventListener('click', openAddMachineModal);
    
    // Event listener per chiudere il modal di aggiunta macchinario
    document.getElementById('closeAddModal').addEventListener('click', closeAddMachineModal);
    document.getElementById('cancelAddMachine').addEventListener('click', closeAddMachineModal);
    
    // Event listener per aggiungere un nuovo macchinario
    document.getElementById('addMachineForm').addEventListener('submit', addNewMachine);
    
    // Event listener per chiudere il modal dei dettagli
    document.getElementById('closeDetailsModal').addEventListener('click', closeMachineDetailsModal);
    
    // Event listener per eliminare un macchinario
    document.getElementById('deleteMachineBtn').addEventListener('click', deleteMachine);
    
    // Event listener per salvare le note
    document.getElementById('saveNotesBtn').addEventListener('click', saveMachineNotes);
    
    // Event listener per modificare un macchinario
    document.getElementById('editMachineBtn').addEventListener('click', editMachine);
    
    // Event listener per la ricerca
    document.getElementById('searchInput').addEventListener('input', function() {
        searchMachines(this.value);
    });
});
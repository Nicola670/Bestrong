document.addEventListener('DOMContentLoaded', function() {
    // Variabili globali per i filtri
    window.filtroAttuale = {
        testo: '',
        gruppo: 'tutti'
    };
    
    // Prendi l'ID del cliente dall'URL
    const urlParams = new URLSearchParams(window.location.search);
    const clienteId = urlParams.get('id-cliente');
    
    // Mostra l'ID del cliente nella pagina
    document.getElementById('clienteId').textContent = clienteId || 'Non specificato';
    
    // Se non c'è un ID cliente, mostra un avviso
    if (!clienteId) {
        alert('Attenzione: Nessun ID cliente specificato nell\'URL. Usa ?id-cliente=X nell\'URL.');
    } else {
        // Carica i dati del cliente (simulato)
        caricaDatiCliente(clienteId);
    }
    
    // Carica gli esercizi disponibili
    caricaEserciziDisponibili();
    
    // Imposta la data di inizio odierna come default
    const oggi = new Date().toISOString().split('T')[0];
    document.getElementById('dataInizio').value = oggi;
    
    // Imposta la data di fine a +30 giorni come default
    const dataFine = new Date();
    dataFine.setDate(dataFine.getDate() + 30);
    document.getElementById('dataFine').value = dataFine.toISOString().split('T')[0];
    
    // Imposta l'evento di ricerca degli esercizi
    document.getElementById('btnSearch').addEventListener('click', cercaEsercizi);
    document.getElementById('searchEsercizi').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            cercaEsercizi();
        }
    });
    
    // Imposta l'evento di salvataggio della scheda
    document.getElementById('salvaScheda').addEventListener('click', salvaScheda);
    
    // Configura il sistema drag and drop
    setupDragAndDrop();
});

// Funzione per caricare i dati del cliente (simulata)
function caricaDatiCliente(clienteId) {
    // futura chiamata API per ottenere i dati reali del cliente
    // momentanea simulazione dei dati
    
    // Simulazione ritardo di rete
    setTimeout(() => {
        const clienteData = {
            id: clienteId,
            nome: 'Mario Rossi',
            email: 'mario.rossi@example.com',
            telefono: '+39 123 456 7890'
        };
        
        // Aggiorna l'interfaccia con i dati del cliente
        document.getElementById('clienteNome').textContent = clienteData.nome;
        document.getElementById('clienteEmail').textContent = clienteData.email;
        document.getElementById('clienteTelefono').textContent = clienteData.telefono;
    }, 500);
}
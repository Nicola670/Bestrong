// Funzione per ottenere i parametri dall'URL
function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    for (const [key, value] of urlParams.entries()) {
        params[key] = value;
    }
    
    return params;
}

// Funzione per impostare i dati del cliente
function setClientData() {
    const urlParams = getUrlParams();
    const clienteId = urlParams.clienteId;
    
    if (clienteId) {
        // Trova il cliente in base all'ID
        const cliente = clients.find(c => c.id == clienteId);
        
        if (cliente) {
            // Imposta i dati del cliente nel form
            document.getElementById('cliente-id').value = cliente.id;
            document.getElementById('cliente-nome').textContent = cliente.name;
            
            // Preseleziona l'obiettivo del cliente se non è stato già selezionato
            const obiettivo = document.getElementById('obiettivo');
            if (obiettivo.value === "" && cliente.objective) {
                obiettivo.value = cliente.objective;
            }
            
            return true;
        }
    }
    
    // Se non è stato trovato il cliente o non c'è un ID nell'URL,
    // reindirizza alla pagina di selezione cliente
    alert('Nessun cliente selezionato. Sarai reindirizzato alla pagina di selezione cliente.');
    // In una app reale, usare: window.location.href = 'pagina-selezione-cliente.html';
    
    return false;
}

// Inizializzazione dell'applicazione
function init() {
    // Imposta i dati del cliente
    if (!setClientData()) {
        // Se non è stato possibile impostare i dati del cliente, 
        // non continuare con l'inizializzazione
        return;
    }
    init();
}
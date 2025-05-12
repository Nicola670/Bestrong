// Array per memorizzare gli esercizi
let exercises = [];
const ip_server = 'http://localhost:5001';  // Aggiunto http:// che mancava

// Aggiungi questa funzione all'inizio del file
async function loadFilterMetadata() {
    try {
        const response = await fetch(`${ip_server}/api/exercise-metadata`);
        if (!response.ok) {
            throw new Error('Errore nel caricamento dei metadati dei filtri');
        }
        const metadata = await response.json();
        
        // Popola i filtri dei gruppi muscolari
        const muscleFilters = document.getElementById('muscle-filters');
        metadata.muscles.forEach(muscle => {
            const muscleId = muscle.toLowerCase().replace(/\s+/g, '-');
            muscleFilters.innerHTML += `
                <div class="form-check">
                    <input class="form-check-input filter-muscle" type="checkbox" 
                           value="${muscle}" id="m-${muscleId}">
                    <label class="form-check-label" for="m-${muscleId}">${muscle}</label>
                </div>
            `;
        });
        
        // Popola i filtri degli obiettivi
        const goalFilters = document.getElementById('goal-filters');
        metadata.goals.forEach(goal => {
            const goalId = goal.toLowerCase().replace(/\s+/g, '-');
            goalFilters.innerHTML += `
                <div class="form-check">
                    <input class="form-check-input filter-goal" type="checkbox" 
                           value="${goal}" id="g-${goalId}">
                    <label class="form-check-label" for="g-${goalId}">${goal}</label>
                </div>
            `;
        });
        
        // Popola i filtri delle difficoltà
        const difficultyFilters = document.getElementById('difficulty-filters');
        metadata.difficulties.forEach(difficulty => {
            const difficultyId = difficulty.toLowerCase().replace(/\s+/g, '-');
            difficultyFilters.innerHTML += `
                <div class="form-check">
                    <input class="form-check-input filter-difficulty" type="checkbox" 
                           value="${difficulty}" id="d-${difficultyId}">
                    <label class="form-check-label" for="d-${difficultyId}">${difficulty}</label>
                </div>
            `;
        });

        // Riattacca gli event listener dopo aver popolato i filtri
        setupFilterEventListeners();
        
    } catch (error) {
        console.error('Errore nel caricamento dei metadati:', error);
    }
}

// Modifica la funzione setupEventListeners esistente
function setupEventListeners() {
    loadFilterMetadata();
}

// Aggiungi questa nuova funzione per gestire gli event listener dei filtri
function setupFilterEventListeners() {
    document.querySelectorAll('.filter-muscle, .filter-goal, .filter-difficulty').forEach(filter => {
        filter.addEventListener('change', renderExercises);
    });
}

// Verificare se ci sono esercizi salvati nel localStorage
document.addEventListener('DOMContentLoaded', () => {
    loadFilterMetadata
    loadExercises();
    setupEventListeners();
    renderExercises();
}); 

// Caricare gli esercizi da localStorage
async function loadExercises() {
    const savedExercises = localStorage.getItem('gym-exercises');
    if (savedExercises) {
        exercises = JSON.parse(savedExercises);
    } else {

        /*
        // Esempi di esercizi predefiniti per demo
        exercises = [
            {
                id: 'ex1',
                name: 'Panca Piana',
                primaryMuscles: ['Pettorali', 'Tricipiti'],
                secondaryMuscles: ['Spalle'],
                goal: 'Massa muscolare',
                difficulty: 'Medio',
                description: 'Sdraiati sulla panca con i piedi ben piantati a terra. Afferra il bilanciere con una presa leggermente più ampia delle spalle. Abbassa il bilanciere al petto controllando il movimento, quindi spingi verso l\'alto fino a distendere completamente le braccia.',
                mediaType: 'image',
                mediaUrl: '/api/placeholder/400/300'
            }
        ];*/
        try {
            const response = await fetch(`${ip_server}/api/exercises`);
            if (!response.ok) {
                throw new Error('Errore durante il recupero degli esercizi');
            }   
            const data = await response.json();
            exercises = data.map(ex => ({
                id: ex.id,
                name: ex.nome,
                description: ex.descrizione,
                mediaType: ex.video_url ? 'video' : (ex.immagine_url ? 'image' : null),
                mediaUrl: ex.video_url || ex.immagine_url || null,
                goal: ex.obiettivo,
                difficulty: ex.difficolta,
                primaryMuscles: ex.muscoli_primari || [],
                secondaryMuscles: ex.muscoli_secondari || []
            }));

            saveExercises();
        } catch (error) {
            console.error('Errore nel caricamento degli esercizi:', error);
            document.getElementById('no-exercises').textContent = 'Errore nel caricamento degli esercizi. Riprova più tardi.';
            document.getElementById('no-exercises').classList.remove('d-none');
        }
    
        

    }
}

// Salva gli esercizi nel localStorage
function saveExercises() {
    localStorage.setItem('gym-exercises', JSON.stringify(exercises));
}

// Configura tutti gli event listener
function setupEventListeners() {
    // Event listener per i filtri
    document.querySelectorAll('.filter-muscle, .filter-goal, .filter-difficulty').forEach(filter => {
        filter.addEventListener('change', renderExercises);
    });

    // Gestione ricerca
    document.getElementById('search-input').addEventListener('input', renderExercises);

    // Pulsante reset filtri
    document.getElementById('reset-filters').addEventListener('click', resetFilters);

    // Pulsante salva esercizio
    document.getElementById('save-exercise').addEventListener('click', saveExercise);

    // Pulsante elimina esercizio
    document.getElementById('delete-exercise').addEventListener('click', () => {
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        deleteModal.show();
    });

    // Conferma eliminazione
    document.getElementById('confirm-delete').addEventListener('click', deleteExercise);

    // Gestione anteprima file media
    document.getElementById('exercise-media').addEventListener('change', handleMediaPreview);

    // Modifica esercizio dal modal visualizzazione
    document.getElementById('edit-exercise-btn').addEventListener('click', () => {
        const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewExerciseModal'));
        viewModal.hide();
        
        // Ottenere l'ID dall'esercizio visualizzato
        const exerciseId = document.getElementById('view-name').dataset.id;
        openEditModal(exerciseId);
    });

    document.getElementById('btnBack').addEventListener('click', function() {
        // Se ci sono modifiche non salvate, chiedi conferma
        const hasUnsavedChanges = localStorage.getItem('unsaved-changes') === 'true';
        
        if (hasUnsavedChanges) {
            if (confirm('Ci sono modifiche non salvate. Sei sicuro di voler tornare indietro?')) {
                window.history.back();
            }
        } else {
            window.history.back();
        }
    });

    // Reset del form modal quando viene chiuso
    document.getElementById('exerciseModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('exercise-form').reset();
        document.getElementById('exercise-id').value = '';
        document.getElementById('media-preview').classList.add('d-none');
        document.getElementById('image-preview').classList.add('d-none');
        document.getElementById('video-preview').classList.add('d-none');
        document.getElementById('exercise-media').value = '';
        document.getElementById('delete-exercise').classList.add('d-none');
        document.getElementById('exerciseModalLabel').textContent = 'Nuovo Esercizio';
    });

    loadFilterMetadata();
}

// Gestione anteprima media
function handleMediaPreview(event) {
    const file = event.target.files[0];
    if (!file) return;

    const previewContainer = document.getElementById('media-preview');
    const imagePreview = document.getElementById('image-preview');
    const videoPreview = document.getElementById('video-preview');
    
    // Reset precedenti preview
    previewContainer.classList.remove('d-none');
    imagePreview.classList.add('d-none');
    videoPreview.classList.add('d-none');
    
    // Mostra anteprima in base al tipo di file
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = e => {
            videoPreview.src = e.target.result;
            videoPreview.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    }
}

// Reset filtri
function resetFilters() {
    document.querySelectorAll('.filter-muscle, .filter-goal, .filter-difficulty').forEach(checkbox => {
        checkbox.checked = false;
    });
    document.getElementById('search-input').value = '';
    renderExercises();
}

// Funzione per salvare/modificare un esercizio
async function saveExercise() {
    // Validazione
    const form = document.getElementById('exercise-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Raccolta dati
    const exerciseId = document.getElementById('exercise-id').value;
    const name = document.getElementById('exercise-name').value.trim();
    const description = document.getElementById('exercise-description').value.trim();
    const goal = document.getElementById('exercise-goal').value;
    const difficulty = document.getElementById('exercise-difficulty').value;
    
    // Raccolta gruppi muscolari primari
    const primaryMuscles = Array.from(document.querySelectorAll('#primary-muscles input:checked')).map(input => input.value);
    if (primaryMuscles.length === 0) {
        alert('Seleziona almeno un gruppo muscolare primario');
        return;
    }
    
    // Raccolta gruppi muscolari secondari
    const secondaryMuscles = Array.from(document.querySelectorAll('#secondary-muscles input:checked')).map(input => input.value);
    
    // Gestione media
    let mediaType = null;
    let mediaUrl = null;
    
    const mediaFile = document.getElementById('exercise-media').files[0];
    
    // Se stiamo modificando un esercizio esistente
    if (exerciseId) {
        const existingExercise = exercises.find(ex => ex.id === exerciseId);
        if (existingExercise) {
            mediaType = existingExercise.mediaType;
            mediaUrl = existingExercise.mediaUrl;
        }
    }
    
    // Se è stato caricato un nuovo file
    if (mediaFile) {
        if (mediaFile.type.startsWith('image/')) {
            mediaType = 'image';
        } else if (mediaFile.type.startsWith('video/')) {
            mediaType = 'video';
        }
        
        // TODO: Implementare caricamento file
        mediaUrl = '/api/placeholder/400/300';
    }

    try {
        const exerciseData = {
            name,
            description,
            goal,
            difficulty,
            primaryMuscles,
            secondaryMuscles,
            mediaType,
            mediaUrl
        };

        // Determina se è un nuovo esercizio o una modifica
        const url = exerciseId ? 
            `${ip_server}/api/exercises/${exerciseId}` : 
            `${ip_server}/api/exercises`;
        
        const method = exerciseId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(exerciseData)
        });

        if (!response.ok) {
            throw new Error('Errore durante il salvataggio dell\'esercizio');
        }

        const savedExercise = await response.json();

        // Aggiorna l'array locale degli esercizi
        if (exerciseId) {
            const idToUpdate = parseInt(exerciseId, 10);
            const index = exercises.findIndex(ex => ex.id === idToUpdate);
            if (index !== -1) {
                exercises[index] = {
                    ...exercises[index],
                    ...exerciseData,
                    id: idToUpdate
                };
            }
        } else {
            exercises.push({
                ...exerciseData,
                id: parseInt(savedExercise.id, 10)  // Converti anche l'ID del nuovo esercizio
            });
        }
        
        // Salva n
        // el localStorage e aggiorna UI
        saveExercises();
        renderExercises();
        
        // Chiudi modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('exerciseModal'));
        modal.hide();

        // Mostra messaggio di successo
        alert('Esercizio salvato con successo!');

    } catch (error) {
        console.error('Errore durante il salvataggio:', error);
        alert('Errore durante il salvataggio dell\'esercizio');
    }
}

// Funzione per eliminare un esercizio
async function deleteExercise() {
    const exerciseId = document.getElementById('exercise-id').value;
    
    if (!exerciseId) {
        console.error('ID esercizio non trovato');
        return;
    }

    try {
        // procedi con l'eliminazione
        const deleteResponse = await fetch(`${ip_server}/api/exercises/${exerciseId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!deleteResponse.ok) {
            throw new Error(`Errore HTTP: ${deleteResponse.status}`);
        }

        // Rimuovi l'esercizio dall'array locale
        const idToDelete = parseInt(exerciseId, 10);
        exercises = exercises.filter(ex => ex.id !== idToDelete);
        
        // Aggiorna localStorage e UI
        saveExercises();
        renderExercises();
        
        // Chiudi entrambi i modal
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        const exerciseModal = bootstrap.Modal.getInstance(document.getElementById('exerciseModal'));
        
        if (deleteModal) deleteModal.hide();
        if (exerciseModal) exerciseModal.hide();

        // Feedback all'utente
        alert('Esercizio eliminato con successo');

    } catch (error) {
        console.error('Errore durante l\'eliminazione:', error);
        alert('Errore durante l\'eliminazione dell\'esercizio: ' + error.message);
    }
}

// Funzione per visualizzare un esercizio
function viewExercise(exerciseId) {
    const exercise = exercises.find(ex => ex.id == exerciseId);
    
    //if (!exercise) return;
    if (!exercise) {
        console.error('Esercizio non trovato:', exerciseId);
        return;
    }
 
    // Popolare il modal con i dati dell'esercizio
    document.getElementById('view-name').textContent = exercise.name;
    document.getElementById('view-name').dataset.id = exercise.id;
    document.getElementById('view-description').textContent = exercise.description;
    
    // Difficoltà
    const difficultyClass = exercise.difficulty.toLowerCase().replace(/\s+/g, '-');
    document.getElementById('view-difficulty').innerHTML = `
        <span class="badge badge-${difficultyClass}">${exercise.difficulty}</span>
    `;
    
    // Obiettivo
    const goalClass = exercise.goal.toLowerCase().replace(/\s+/g, '-');
    document.getElementById('view-goal').innerHTML = `
        <span class="badge badge-${goalClass}">${exercise.goal}</span>
    `;
    
    // Gestione gruppi muscolari
    document.getElementById('view-primary-muscles').innerHTML = exercise.primaryMuscles?.map(muscle => 
        `<span class="badge bg-primary me-1">${muscle}</span>`
    ).join('') || 'Nessuno';
    
    document.getElementById('view-secondary-muscles').innerHTML = exercise.secondaryMuscles?.map(muscle => 
        `<span class="badge bg-secondary me-1">${muscle}</span>`
    ).join('') || 'Nessuno';

    // Gestione media
    const viewImage = document.getElementById('view-image');
    const viewVideo = document.getElementById('view-video');
    const noMedia = document.getElementById('no-media');
    
    viewImage.classList.add('d-none');
    viewVideo.classList.add('d-none');
    noMedia.classList.add('d-none');
    
    if (exercise.mediaType === 'image' && exercise.mediaUrl) {
        viewImage.src = exercise.mediaUrl;
        viewImage.classList.remove('d-none');
    } else if (exercise.mediaType === 'video' && exercise.mediaUrl) {
        viewVideo.src = exercise.mediaUrl;
        viewVideo.classList.remove('d-none');
    } else {
        noMedia.classList.remove('d-none');
    }
    
    // Mostrare il modal
    const viewModal = new bootstrap.Modal(document.getElementById('viewExerciseModal'));
    viewModal.show();
}


// Funzione per aprire il modal di modifica
function openEditModal(exerciseId) {
    const exercise = exercises.find(ex => ex.id == exerciseId);
    //if (!exercise) return;
    if (!exercise) {
        console.error('Esercizio non trovato:', exerciseId);
        return;
    }
    
    document.getElementById('exerciseModalLabel').textContent = 'Modifica Esercizio';
    document.getElementById('exercise-id').value = exercise.id;
    document.getElementById('exercise-name').value = exercise.name;
    document.getElementById('exercise-description').value = exercise.description;
    document.getElementById('exercise-goal').value = exercise.goal;
    document.getElementById('exercise-difficulty').value = exercise.difficulty;
    
    // Reset checkbox
    document.querySelectorAll('#primary-muscles input, #secondary-muscles input').forEach(input => {
        input.checked = false;
    });
    
    // Seleziona gruppi muscolari primari
    exercise.primaryMuscles.forEach(muscle => {
        if (muscle && typeof muscle === 'string') {  // Controlla che muscle sia definito
            const inputId = `pm-${muscle.toLowerCase().replace(/\s+/g, '')}`;
            const input = document.getElementById(inputId);
            if (input) input.checked = true;
        }
    });
    
    // Seleziona gruppi muscolari secondari
    exercise.secondaryMuscles.forEach(muscle => {
        if (muscle && typeof muscle === 'string') {  // Controlla che muscle sia definito
            const inputId = `sm-${muscle.toLowerCase().replace(/\s+/g, '')}`;
            const input = document.getElementById(inputId);
            if (input) input.checked = true;
        }
    });
    
    // Anteprima media
    const mediaPreview = document.getElementById('media-preview');
    const imagePreview = document.getElementById('image-preview');
    const videoPreview = document.getElementById('video-preview');
    
    mediaPreview.classList.add('d-none');
    imagePreview.classList.add('d-none');
    videoPreview.classList.add('d-none');
    
    if (exercise.mediaType && exercise.mediaUrl) {
        mediaPreview.classList.remove('d-none');
        
        if (exercise.mediaType === 'image') {
            imagePreview.src = exercise.mediaUrl;
            imagePreview.classList.remove('d-none');
        } else if (exercise.mediaType === 'video') {
            videoPreview.src = exercise.mediaUrl;
            videoPreview.classList.remove('d-none');
        }
    }
    
    // Mostra pulsante elimina
    document.getElementById('delete-exercise').classList.remove('d-none');
    
    // Mostra modal
    const modal = new bootstrap.Modal(document.getElementById('exerciseModal'));
    modal.show();
}

// Renderizzazione esercizi con filtri applicati
function renderExercises() {
    const container = document.getElementById('exercises-container');
    const noExercises = document.getElementById('no-exercises');
    
    // Controllo se gli elementi esistono nel DOM
    if (!container || !noExercises) {
        console.error('Elementi mancanti nel DOM: exercises-container o no-exercises');
        return;
    }
    
    // Ottenere i filtri selezionati
    const selectedMuscles = Array.from(document.querySelectorAll('.filter-muscle:checked')).map(input => input.value);
    const selectedGoals = Array.from(document.querySelectorAll('.filter-goal:checked')).map(input => input.value);
    const selectedDifficulties = Array.from(document.querySelectorAll('.filter-difficulty:checked')).map(input => input.value);
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    // Applicare i filtri
    let filteredExercises = exercises;
    
    // Filtro per termine di ricerca
    if (searchTerm) {
        filteredExercises = filteredExercises.filter(exercise => 
            (exercise.name && exercise.name.toLowerCase().includes(searchTerm)) ||
            (exercise.description && exercise.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Filtro per gruppo muscolare
    if (selectedMuscles.length > 0) {
        filteredExercises = filteredExercises.filter(exercise => {
            const allMuscles = [...(exercise.primaryMuscles || []), ...(exercise.secondaryMuscles || [])];
            return selectedMuscles.some(muscle => allMuscles.includes(muscle));
        });
    }
    
    // Filtro per obiettivo
    if (selectedGoals.length > 0) {
        filteredExercises = filteredExercises.filter(exercise => 
            exercise.goal && selectedGoals.includes(exercise.goal)
        );
    }
    
    // Filtro per difficoltà
    if (selectedDifficulties.length > 0) {
        filteredExercises = filteredExercises.filter(exercise => 
            exercise.difficulty && selectedDifficulties.includes(exercise.difficulty)
        );
    }
    
    // Mostrare risultati
    container.innerHTML = '';
    
    if (filteredExercises.length === 0) {
        noExercises.classList.remove('d-none');
    } else {
        noExercises.classList.add('d-none');
        
        filteredExercises.forEach(exercise => {
            // Controlliamo che difficulty e goal siano definiti prima di usare toLowerCase()
            const difficultyClass = exercise.difficulty && typeof exercise.difficulty === 'string' ? 
                exercise.difficulty.toLowerCase().replace(/\s+/g, '-') : 'medio';
            const goalClass = exercise.goal && typeof exercise.goal === 'string' ? 
                exercise.goal.toLowerCase().replace(/\s+/g, '-') : 'general';
            
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4 fade-in';
            card.innerHTML = `
                <div class="card exercise-card shadow-sm h-100">
                    <div class="exercise-image-container">
                        ${exercise.mediaType === 'image' && exercise.mediaUrl ? 
                            `<img src="${exercise.mediaUrl}" alt="${exercise.name || 'Esercizio'}" class="card-img-top">` : 
                            exercise.mediaType === 'video' && exercise.mediaUrl ? 
                            `<video src="${exercise.mediaUrl}" class="card-img-top"></video>` :
                            `<div class="no-media">
                                <i class="fas fa-dumbbell fa-3x mb-2"></i>
                                <div>Nessun media</div>
                            </div>`
                        }
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${exercise.name || 'Esercizio senza nome'}</h5>
                        <p class="card-text text-truncate">${exercise.description || 'Nessuna descrizione'}</p>
                        
                        <div class="mb-2">
                           <span class="badge badge-${difficultyClass}">${exercise.difficulty || 'Medio'}</span>
                            <span class="badge badge-${goalClass}">${exercise.goal || 'General'}</span>
                        </div>
                        
                        <div class="mb-2">
                            ${(exercise.primaryMuscles || []).map(muscle => 
                                `<span class="badge badge-primary-muscle">${muscle}</span>`
                            ).join('')}
                        </div>
                        
                        <div class="mt-auto">
                        <div class="btn-group w-100">
                            <button class="btn btn-outline-primary btn-sm" onclick="viewExercise('${exercise.id}')">
                                <i class="fas fa-eye me-1"></i>Visualizza
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="openEditModal('${exercise.id}')">
                                <i class="fas fa-edit me-1"></i>Modifica
                            </button>
                        </div>
                    </div>
                    </div>
                </div>
            `;
            
            
            container.appendChild(card);
        });
        
        

        // Aggiungere listener per i bottoni
        document.querySelectorAll('.view-exercise').forEach(button => {
            button.addEventListener('click', () => viewExercise(button.dataset.id));
        });
        
        document.querySelectorAll('.edit-exercise').forEach(button => {
            button.addEventListener('click', () => openEditModal(button.dataset.id));
        });
    }
}
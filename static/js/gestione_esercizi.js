// Array per memorizzare gli esercizi
let exercises = [];
const ip_server = 'http://localhost';  // Aggiunto http:// che mancava

// Verificare se ci sono esercizi salvati nel localStorage
document.addEventListener('DOMContentLoaded', () => {
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
            },
            {
                id: 'ex2',
                name: 'Squat',
                primaryMuscles: ['Quadricipiti', 'Glutei'],
                secondaryMuscles: ['Femorali', 'Adduttori'],
                goal: 'Massa muscolare',
                difficulty: 'Difficile',
                description: 'Posiziona il bilanciere sulle spalle, piedi alla larghezza delle spalle. Piega le ginocchia mantenendo la schiena dritta fino a quando le cosce sono parallele al pavimento, quindi torna alla posizione di partenza.',
                mediaType: 'image',
                mediaUrl: '/api/placeholder/400/300'
            },
            {
                id: 'ex3',
                name: 'Plank',
                primaryMuscles: ['Addominali'],
                secondaryMuscles: ['Spalle', 'Glutei'],
                goal: 'Tonificazione',
                difficulty: 'Facile',
                description: 'Posizionati a terra con gli avambracci appoggiati sul pavimento, gomiti sotto le spalle e piedi uniti. Solleva il corpo mantenendo una linea retta dalla testa ai piedi. Mantieni la posizione contraendo gli addominali.',
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
function saveExercise() {
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
        
        
        //qui andrebbe gestito il caricamento effettivo del file
        mediaUrl = '/api/placeholder/400/300';
    }
    
    // Creazione oggetto esercizio
    const exercise = {
        id: exerciseId || 'ex' + Date.now(),
        name,
        primaryMuscles,
        secondaryMuscles,
        goal,
        difficulty,
        description,
        mediaType,
        mediaUrl
    };
    
    // Aggiungi o aggiorna esercizio nell'array
    if (exerciseId) {
        const index = exercises.findIndex(ex => ex.id === exerciseId);
        if (index !== -1) {
            exercises[index] = exercise;
        }
    } else {
        exercises.push(exercise);
    }
    
    // Salva nel localStorage e aggiorna UI
    saveExercises();
    renderExercises();
    
    // Chiudi modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('exerciseModal'));
    modal.hide();
}

// Funzione per eliminare un esercizio
function deleteExercise() {
    const exerciseId = document.getElementById('exercise-id').value;
    exercises = exercises.filter(ex => ex.id !== exerciseId);
    
    saveExercises();
    renderExercises();
    
    // Chiudi entrambi i modal
    const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
    deleteModal.hide();
    
    const exerciseModal = bootstrap.Modal.getInstance(document.getElementById('exerciseModal'));
    exerciseModal.hide();
}

// Funzione per visualizzare un esercizio
function viewExercise(exerciseId) {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    
    // Popolare il modal di visualizzazione
    document.getElementById('view-name').textContent = exercise.name;
    document.getElementById('view-name').dataset.id = exercise.id;
    document.getElementById('view-description').textContent = exercise.description;
    
    // Difficoltà - Controlla che difficulty sia definito prima di usare toLowerCase()
    const difficultyClass = exercise.difficulty && typeof exercise.difficulty === 'string' ? 
        exercise.difficulty.toLowerCase().replace(/\s+/g, '-') : 'medio';
    document.getElementById('view-difficulty').innerHTML = `
        <span class="badge badge-${difficultyClass}">${exercise.difficulty || 'Medio'}</span>
    `;
    
    // Obiettivo - Controlla che goal sia definito prima di usare toLowerCase()
    const goalClass = exercise.goal && typeof exercise.goal === 'string' ? 
        exercise.goal.toLowerCase().replace(/\s+/g, '-') : 'general';
    document.getElementById('view-goal').innerHTML = `
        <span class="badge badge-${goalClass}">${exercise.goal || 'General'}</span>
    `;
    
    // Gruppi muscolari primari
    document.getElementById('view-primary-muscles').innerHTML = exercise.primaryMuscles.map(muscle => 
        `<span class="muscle-tag badge-primary-muscle">${muscle}</span>`
    ).join('');
    
    // Gruppi muscolari secondari
    document.getElementById('view-secondary-muscles').innerHTML = 
        exercise.secondaryMuscles.length > 0 
            ? exercise.secondaryMuscles.map(muscle => 
                `<span class="muscle-tag badge-secondary-muscle">${muscle}</span>`
              ).join('')
            : '<span class="text-muted">Nessuno</span>';
    
    // Media
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
    
    // Mostra il modal
    const viewModal = new bootstrap.Modal(document.getElementById('viewExerciseModal'));
    viewModal.show();
}

// Funzione per aprire il modal di modifica
function openEditModal(exerciseId) {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    
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
                                <button class="btn btn-outline-primary btn-sm view-exercise" data-id="${exercise.id}">
                                    <i class="fas fa-eye me-1"></i>Visualizza
                                </button>
                                <button class="btn btn-outline-secondary btn-sm edit-exercise" data-id="${exercise.id}">
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
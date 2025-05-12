// DOM Elements
const playButton = document.getElementById('play-btn');
const exerciseVideo = document.getElementById('exercise-video');
const videoOverlay = document.querySelector('.video-overlay');
const timerElement = document.getElementById('timer');
const startTimerBtn = document.getElementById('start-timer');
const pauseTimerBtn = document.getElementById('pause-timer');
const resetTimerBtn = document.getElementById('reset-timer');
const timerProgressBar = document.getElementById('timer-progress');
const nextExerciseBtn = document.getElementById('next-exercise');
const prevExerciseBtn = document.getElementById('prev-exercise');
const exerciseName = document.getElementById('exercise-name');
const exerciseContainer = document.querySelector('.exercise-container');
const infoBoxes = document.querySelectorAll('.info-box');

// Variabili globali
let currentExerciseIndex = 0;
let exercises = [];
let currentScheda = null;

// Timer variables
let timerInterval;
let totalSeconds = 60; // Default 60 seconds
let currentSeconds = totalSeconds;
let isTimerRunning = false;

async function loadWorkoutDetails(schedaId) {
    try {
        const response = await fetch(`/api/schede/${schedaId}`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Errore nel caricamento della scheda');
        
        currentScheda = await response.json();
        exercises = currentScheda.esercizi.map(ex => ({
            id: ex.id,
            name: ex.nome,
            category: ex.gruppo || 'Generale',
            // Usa l'API esistente per lo streaming del video
            videoSrc: `/api/exercise/video/${ex.id}`,
            sets: ex.serie,
            reps: ex.ripetizioni,
            rest: ex.recupero || 60,
            weight: ex.peso_kg,
            instructions: ex.descrizione ? ex.descrizione.split('\n') : [
                'Nessuna istruzione disponibile'
            ]
        }));

        // Inizializza la schermata con il primo esercizio
        updateExerciseDisplay(0);
        setupEventListeners();
        animateElements();

    } catch (error) {
        console.error('Errore:', error);
        showError('Errore nel caricamento della scheda');
    }
}

function updateExerciseDisplay(index) {
    const exercise = exercises[index];
    if (!exercise) return;
    
    // Update exercise name and category
    exerciseName.textContent = exercise.name;
    document.querySelector('.badge').textContent = exercise.category;
    
    // Update video source and display
    exerciseVideo.src = exercise.videoSrc;
    exerciseVideo.style.display = 'block';
    exerciseVideo.controls = true; // Mostra sempre i controlli
    videoOverlay.style.display = 'flex';
    
    // Reset video state
    exerciseVideo.pause();
    exerciseVideo.currentTime = 0;
    videoOverlay.style.opacity = '1';
    videoOverlay.style.pointerEvents = 'auto';
    
    // Update exercise info
    document.querySelector('.sets .value').textContent = exercise.sets;
    document.querySelector('.reps .value').textContent = exercise.reps;
    document.querySelector('.rest .value').textContent = `${exercise.rest}s`;
    document.querySelector('.weight .value').textContent = exercise.weight ? `${exercise.weight}kg` : '0kg';
    
    // Update timer
    totalSeconds = exercise.rest;
    currentSeconds = totalSeconds;
    updateTimerDisplay();
    
    // Update instructions
    const instructionsText = exercise.instructions.map((instruction, i) => {
        return `${i + 1}. ${instruction}`;
    }).join('<br>');
    document.querySelector('.instructions p').innerHTML = instructionsText;
    
    // Update navigation buttons state
    updateNavigationButtons(index);
}

function updateNavigationButtons(index) {
    prevExerciseBtn.disabled = index === 0;
    nextExerciseBtn.disabled = index === exercises.length - 1;
    
    prevExerciseBtn.style.opacity = prevExerciseBtn.disabled ? '0.5' : '1';
    prevExerciseBtn.style.cursor = prevExerciseBtn.disabled ? 'not-allowed' : 'pointer';
    
    nextExerciseBtn.style.opacity = nextExerciseBtn.disabled ? '0.5' : '1';
    nextExerciseBtn.style.cursor = nextExerciseBtn.disabled ? 'not-allowed' : 'pointer';
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.querySelector('main').prepend(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Setup event listeners
function setupEventListeners(){
    // Video controls
    playButton.addEventListener('click', toggleVideo);
    exerciseVideo.addEventListener('play', () => {
        videoOverlay.style.opacity = '0';
        videoOverlay.style.pointerEvents = 'none'; // Permette di interagire con il video
    });
    exerciseVideo.addEventListener('pause', () => {
        videoOverlay.style.opacity = '1';
        videoOverlay.style.pointerEvents = 'auto';
    });
    
    // Aggiungi event listener per mostrare i controlli quando il mouse è sopra il video
    const videoWrapper = document.querySelector('.video-wrapper');
    videoWrapper.addEventListener('mouseover', () => {
        exerciseVideo.controls = true;
    });
    
    // Timer controls
    startTimerBtn.addEventListener('click', startTimer);
    pauseTimerBtn.addEventListener('click', pauseTimer);
    resetTimerBtn.addEventListener('click', resetTimer);
    
    // Navigation controls
    nextExerciseBtn.addEventListener('click', nextExercise);
    prevExerciseBtn.addEventListener('click', prevExercise);
}

// Video functions
function toggleVideo(){
    if (exerciseVideo.paused) {
        exerciseVideo.play();
    } else {
        exerciseVideo.pause();
    }
}

// Timer functions
function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        timerInterval = setInterval(updateTimer, 1000);
        animateTimerButton(startTimerBtn);
        
        // Calcola la percentuale di completamento corrente
        const percentageLeft = (currentSeconds / totalSeconds);
        
        // Reset della transizione e imposta la barra alla posizione corrente
        timerProgressBar.style.transition = 'none';
        timerProgressBar.offsetHeight; // Forza il reflow del DOM
        timerProgressBar.style.transform = `scaleX(${percentageLeft})`;
        timerProgressBar.offsetHeight; // Forza il reflow del DOM
        
        // Imposta la nuova transizione per il tempo rimanente
        timerProgressBar.style.transition = `transform ${currentSeconds}s linear`;
        timerProgressBar.style.transform = 'scaleX(0)';
    }
}

function pauseTimer() {
    if (isTimerRunning) {
        isTimerRunning = false;
        clearInterval(timerInterval);
        animateTimerButton(pauseTimerBtn);
        
        // Mantieni la posizione corrente della barra
        const computedStyle = window.getComputedStyle(timerProgressBar);
        const transform = computedStyle.getPropertyValue('transform');
        timerProgressBar.style.transition = 'none';
        timerProgressBar.style.transform = transform;
    }
}

function resetTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    currentSeconds = totalSeconds;
    updateTimerDisplay();
    animateTimerButton(resetTimerBtn);
    
    // Reset completo della barra
    timerProgressBar.style.transition = 'none';
    timerProgressBar.offsetHeight; // Forza il reflow del DOM
    timerProgressBar.style.transform = 'scaleX(1)';
}

function updateTimer(){
    if (currentSeconds > 0) {
        currentSeconds--;
        updateTimerDisplay();
    } else {
        pauseTimer();
        playTimerEndSound();
        showTimerCompleteNotification();
        
        // Reset timer automatically after 2 seconds
        setTimeout(() => {
            resetTimer();
        }, 2000);
    }
}

function updateTimerDisplay(){
    const minutes = Math.floor(currentSeconds / 60);
    const seconds = currentSeconds % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

//da implementare se si vorra aggiungere un file audio per la fine del timer
function playTimerEndSound(){}

function showTimerCompleteNotification(){
    // Create a notification element
    const notification = document.createElement('div');
    notification.className = 'timer-notification';
    notification.innerHTML = '<i class="fas fa-check-circle"></i> Riposo completato!';
    
    // Style the notification
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = 'var(--primary-color)';
    notification.style.color = 'white';
    notification.style.padding = '1rem';
    notification.style.borderRadius = 'var(--radius)';
    notification.style.boxShadow = 'var(--shadow)';
    notification.style.zIndex = '1000';
    notification.style.animation = 'slideIn 0.5s ease';
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
            }
            to {
                transform: translateX(0);
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
            }
            to {
                transform: translateX(100%);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// Navigazione esercizi
function nextExercise() {
    if (currentExerciseIndex < exercises.length - 1) {
        currentExerciseIndex++;
        updateExerciseWithAnimation();
    }
}

function prevExercise() {
    if (currentExerciseIndex > 0) {
        currentExerciseIndex--;
        updateExerciseWithAnimation();
    }
}

function updateExerciseWithAnimation(){
    // Add exit animation
    exerciseContainer.style.animation = 'fadeOut 0.3s ease forwards';
    
    // After animation completes, update content and animate in
    setTimeout(() => {
        updateExerciseDisplay(currentExerciseIndex);
        exerciseContainer.style.animation = 'fadeIn 0.5s ease';
    }, 300);
    
    // Add fadeOut animation keyframes
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fadeOut {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-20px);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Reset timer
    resetTimer();
}

// Animazioni
function animateElements() {
    // Animate info boxes with delay
    infoBoxes.forEach((box, index) => {
        setTimeout(() => {
            box.style.animation = 'pulse 2s infinite';
        }, index * 200);
    });
    
    // Animate video container on hover
    const videoWrapper = document.querySelector('.video-wrapper');
    videoWrapper.addEventListener('mouseenter', () => {
        videoWrapper.style.transform = 'scale(1.02)';
        videoWrapper.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
    });
    
    videoWrapper.addEventListener('mouseleave', () => {
        videoWrapper.style.transform = 'scale(1)';
        videoWrapper.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
    });
    
    // Add smooth transitions
    videoWrapper.style.transition = 'all 0.3s ease';
}

function animateTimerButton(button) {
    button.style.animation = 'pulse 0.5s';
    setTimeout(() => {
        button.style.animation = '';
    }, 500);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const schedaId = urlParams.get('scheda_id');
    
    if (schedaId) {
        loadWorkoutDetails(schedaId);
    } else {
        showError('ID scheda non trovato');
    }
});

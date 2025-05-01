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


// Timer variables
let timerInterval;
let totalSeconds = 60; // Default 60 seconds
let currentSeconds = totalSeconds;
let isTimerRunning = false;

const exercises = [
    {
        id: 1,
        name: 'Squat',
        category: 'Gambe',
        videoSrc: '/api/placeholder/640/360',
        sets: 4,
        reps: 12,
        rest: 60,
        instructions: [
            'Posizionati con i piedi alla larghezza delle spalle',
            'Mantieni la schiena dritta e il petto in fuori',
            'Abbassati come se dovessi sederti, fino a quando le cosce sono parallele al pavimento',
            'Risali spingendo sui talloni e contraendo i glutei'
        ]
    },
    {
        id: 2,
        name: 'Push-up',
        category: 'Petto',
        videoSrc: '/api/placeholder/640/360',
        sets: 3,
        reps: 15,
        rest: 45,
        instructions: [
            'Posizionati con le mani leggermente più larghe delle spalle',
            'Mantieni il corpo allineato dalla testa ai piedi',
            'Abbassati flettendo i gomiti fino a sfiorare il pavimento',
            'Risali estendendo le braccia senza bloccare i gomiti'
        ]
    },
    {
        id: 3,
        name: 'Plank',
        category: 'Addominali',
        videoSrc: '/api/placeholder/640/360',
        sets: 3,
        reps: '30 secondi',
        rest: 30,
        instructions: [
            'Posizionati sui gomiti e sulle punte dei piedi',
            'Mantieni il corpo allineato dalla testa ai piedi',
            'Contrai addominali e glutei',
            'Respira normalmente e mantieni la posizione'
        ]
    }
];

// Initialize page
function initializePage() {
    updateExerciseDisplay(currentExerciseIndex);
    setupEventListeners();
    animateElements();
}

// Setup event listeners
function setupEventListeners(){
    // Video controls
    playButton.addEventListener('click', toggleVideo);
    exerciseVideo.addEventListener('play', () => {
        videoOverlay.style.opacity = '0';
    });
    exerciseVideo.addEventListener('pause', () => {
        videoOverlay.style.opacity = '1';
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


//timer functions
function startTimer(){
    if (!isTimerRunning) {
        isTimerRunning = true;
        timerInterval = setInterval(updateTimer, 1000);
        animateTimerButton(startTimerBtn);
        
        // Start progress bar animation
        timerProgressBar.style.transition = `transform ${currentSeconds}s linear`;
        timerProgressBar.style.transform = 'scaleX(0)';
    }
}

function pauseTimer(){
    if (isTimerRunning) {
        isTimerRunning = false;
        clearInterval(timerInterval);
        animateTimerButton(pauseTimerBtn);
        
        // Pause progress bar animation
        const computedStyle = window.getComputedStyle(timerProgressBar);
        const transform = computedStyle.getPropertyValue('transform');
        timerProgressBar.style.transition = 'none';
        timerProgressBar.style.transform = transform;
    }
}

function resetTimer(){
    isTimerRunning = false;
    clearInterval(timerInterval);
    currentSeconds = totalSeconds;
    updateTimerDisplay();
    animateTimerButton(resetTimerBtn);
    
    // Reset progress bar
    timerProgressBar.style.transition = 'none';
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

function showTimerCompleteNotification(){}


// navigazione esercizi
function nextExercise(){}

function prevExercise(){}

function updateExerciseWithAnimation(){}

function updateExerciseDisplay(index){}

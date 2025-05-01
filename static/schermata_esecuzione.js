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
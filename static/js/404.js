// Array di percorsi delle GIF da mostrare casualmente
const randomMedia = [
    "../static/gifs/gif1.webm",
    "../static/gifs/gif2.webm",
    "../static/gifs/gif3.webm",
    "../static/gifs/gif4.webm",
    "../static/gifs/gif5.webm",
    "../static/gifs/gif6.webm",
    "../static/gifs/gif7.webm",
    "../static/gifs/gif8.webm"
];

// Funzione che viene eseguita quando la pagina è completamente caricata
window.onload = function() {
    // Seleziona una GIF casuale dall'array
    const randomIndex = Math.floor(Math.random() * randomMedia.length);
    const selectedMedia = randomMedia[randomIndex];
    
    // Crea un elemento immagine
    const mediaElement = document.createElement('img');
    mediaElement.src = selectedMedia;
    mediaElement.alt = "Pagina non trovata";
    mediaElement.className = "media";
    
    // Inserisce l'elemento nel container
    document.querySelector('.media-container').innerHTML = '';
    document.querySelector('.media-container').appendChild(mediaElement);
}
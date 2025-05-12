// Array di percorsi delle GIF da mostrare casualmente
const randomMedia = [
    "../static/gifs/gif1.webp",
    "../static/gifs/gif2.webp",
    "../static/gifs/gif3.webp",
    "../static/gifs/gif4.webp",
    "../static/gifs/gif5.webp",
    "../static/gifs/gif6.webp",
    "../static/gifs/gif7.webp",
    "../static/gifs/gif8.webp"
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
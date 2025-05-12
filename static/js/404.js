// Array di percorsi delle GIF da mostrare casualmente
const randomMedia = [
    "../static/gifs/error1.gif",
    "../static/gifs/error2.gif",
    "../static/gifs/error3.gif",
    "../static/gifs/error4.gif",
    "../static/gifs/error5.gif",
    "../static/gifs/error6.gif",
    "../static/gifs/error7.gif",
    "../static/gifs/error8.gif",
    "../static/gifs/error9.gif",
    "../static/gifs/error10.gif"
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
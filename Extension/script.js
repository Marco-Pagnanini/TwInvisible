const dropzoneBox = document.getElementsByClassName("dropzone-box")[0];
const inputFiles = document.querySelectorAll(".dropzone-area input[type='file']");
const inputElement = inputFiles[0];
const dropZoneElement = inputElement.closest(".dropzone-area");
const form = document.querySelector(".dropzone-box");

let selectedFile = null; // Variabile per memorizzare il file selezionato

// Quando un file viene selezionato tramite l'input file
inputElement.addEventListener("change", (e) => {
    if (!inputElement.files.length) return;

    const file = inputElement.files[0];

    // Verifica che il file sia un .json
    if (!file.name.endsWith('.json')) {
        alert("Please upload a .json file.");
        dropZoneElement.classList.add("dropzone--error");
        return;
    }

    // Se il file è un .json, aggiorna la lista dei file nella dropzone
    updateDropzoneFileList(dropZoneElement, file);
    dropZoneElement.classList.remove("dropzone--error");

    // Memorizza il file selezionato senza salvarlo nel localStorage
    selectedFile = file;
});

// Gestione del dragover per far capire all'utente che può "lasciare" il file
dropZoneElement.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZoneElement.classList.add("dropzone--over");
});

// Gestione dell'evento "dragleave" e "dragend" per rimuovere la classe quando il file viene trascinato via
["dragleave", "dragend"].forEach((type) => {
    dropZoneElement.addEventListener(type, (e) => {
        dropZoneElement.classList.remove("dropzone--over");
    });
});

// Gestione del drop del file
dropZoneElement.addEventListener("drop", (e) => {
    e.preventDefault();

    if (!e.dataTransfer.files.length) return;

    const file = e.dataTransfer.files[0];

    // Verifica che il file sia un .json
    if (!file.name.endsWith('.json')) {
        alert("Please upload a .json file.");
        dropZoneElement.classList.add("dropzone--error");
        dropZoneElement.classList.remove("dropzone--over");
        return;
    }

    // Se il file è un .json, aggiorna la lista dei file nella dropzone
    inputElement.files = e.dataTransfer.files;
    updateDropzoneFileList(dropZoneElement, file);
    dropZoneElement.classList.remove("dropzone--over");
    dropZoneElement.classList.remove("dropzone--error");

    // Memorizza il file selezionato senza salvarlo nel localStorage
    selectedFile = file;
});

// Funzione per aggiornare il messaggio nella dropzone con le informazioni del file
const updateDropzoneFileList = (dropZoneElement, file) => {
    let dropzoneFileMessage = dropZoneElement.querySelector(".file-info");
    dropzoneFileMessage.innerHTML = `${file.name}, ${file.size} bytes`;
};

// Reset del form
form.addEventListener("reset", () => {
    const fileInfo = dropZoneElement.querySelector(".file-info");
    fileInfo.innerHTML = "No Files Selected";
    dropZoneElement.classList.remove("dropzone--over", "dropzone--error");
    selectedFile = null; // Resetta il file selezionato
});

// Funzione per salvare il file nel chrome.storage.local sotto "twin/tokens.json"
const saveFileToLocalStorage = () => {
    if (!selectedFile) {
        alert("No file selected.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const fileContent = JSON.parse(event.target.result);

            // Crea un oggetto che simula la struttura delle cartelle
            const twinFolder = {}; // puoi leggere dati precedenti se vuoi

            // Aggiungi il file JSON sotto il nome "tokens.json" nella cartella "twin"
            twinFolder["tokens.json"] = fileContent;

            // Salva l'oggetto "twin" nel chrome.storage.local
            chrome.storage.local.set({ twin: twinFolder }, () => {
                console.log('File saved in chrome.storage.local');

                getFileFromChromeStorage().then((tokensJson) => {
                    console.log("Tokens:", tokensJson);
                }).catch((err) => {
                    console.error("Errore nel recupero del file:", err);
                });

                alert('File successfully saved to chrome.storage.local as "twin/tokens.json"');
            });
        } 
        catch (error) {
            alert('Error parsing the JSON file. Please try again.');
            console.error('Error parsing JSON:', error);
        }
    };

    reader.readAsText(selectedFile); // Leggi il file come testo
};

// Funzione asincrona per ottenere il file "tokens.json" da chrome.storage.local
function getFileFromChromeStorage() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['twin'], (result) => {
            if (chrome.runtime && chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
            }
            const twinFolder = result.twin;
            if (twinFolder && twinFolder["tokens.json"]) {
                resolve(twinFolder["tokens.json"]);
            } else {
                resolve(null);
            }
        });
    });
}

// Listener aggiornato per il pulsante submit
document.getElementById("submit-button").addEventListener("click", (e) => {
    e.preventDefault();  // Evita che il form venga inviato (comportamento predefinito)
    saveFileToLocalStorage();  // Salva il file solo quando l'utente clicca "Save"
});
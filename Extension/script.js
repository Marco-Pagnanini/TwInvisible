const dropzoneBox = document.getElementsByClassName("dropzone-box")[0];
const inputFiles = document.querySelectorAll(".dropzone-area input[type='file']");
const inputElement = inputFiles[0];
const dropZoneElement = inputElement.closest(".dropzone-area");
const form = document.querySelector(".dropzone-box");

inputElement.addEventListener("change", (e) => {
    if (!inputElement.files.length) return;

    const file = inputElement.files[0];

    // Verifica che il file sia un .json
    if (!file.name.endsWith('.json')) {
        alert("Please upload a .json file.");
        return;
    }

    // Se il file è un .json, aggiorna la lista dei file nella dropzone
    updateDropzoneFileList(dropZoneElement, file);
});

dropZoneElement.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZoneElement.classList.add("dropzone--over");
});

["dragleave", "dragend"].forEach((type) => {
    dropZoneElement.addEventListener(type, (e) => {
        dropZoneElement.classList.remove("dropzone--over");
    });
});

dropZoneElement.addEventListener("drop", (e) => {
    e.preventDefault();

    if (!e.dataTransfer.files.length) return;

    const file = e.dataTransfer.files[0];

    // Verifica che il file sia un .json
    if (!file.name.endsWith('.json')) {
        alert("Please upload a .json file.");
        dropZoneElement.classList.remove("dropzone--over");
        return;
    }

    // Se il file è un .json, aggiorna la lista dei file nella dropzone
    inputElement.files = e.dataTransfer.files;
    updateDropzoneFileList(dropZoneElement, file);

    dropZoneElement.classList.remove("dropzone--over");
});

const updateDropzoneFileList = (dropZoneElement, file) => {
    let dropzoneFileMessage = dropZoneElement.querySelector(".file-info");
    dropzoneFileMessage.innerHTML = ` ${file.name}, ${file.size} bytes `;
};

form.addEventListener("reset", () => {
    const fileInfo = dropZoneElement.querySelector(".file-info");
    fileInfo.innerHTML = "No Files Selected";
    dropZoneElement.classList.remove("dropzone--over");
});
if (typeof pdfjsLib !== "undefined") {

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "./vendor/pdfjs/pdf.worker.min.js";

} else {
    console.error("PDF.js library not loaded!");
}

require([
    "app/App"
], function (App) {

    var application = new App();

    application.start();

});
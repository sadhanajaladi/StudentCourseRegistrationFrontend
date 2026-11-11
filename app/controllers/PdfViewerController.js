
define([
    "app/config",
    "app/widgets/PdfAnnotationViewer"
], function (config, PdfAnnotationViewer) {

    function PdfViewerController() {
        this.viewer = new PdfAnnotationViewer();
    }

    // Create the PDF viewing area
    PdfViewerController.prototype.initialize = function (parent) {
        return this.viewer.createContainer(parent);
    };

    // Open a selected document version
    PdfViewerController.prototype.openVersion = function (
        documentId,
        versionNumber
    ) {

        var token = localStorage.getItem("jwtToken");

        var pdfUrl =
            config.API_BASE_URL +
            "/documents/" + documentId +
            "/versions/" + versionNumber +
            "/download";

        var annotationUrl =
            config.API_BASE_URL +
            "/documents/" + documentId +
            "/versions/" + versionNumber +
            "/annotations";

        var container = document.getElementById("pdf-viewer");

        if (!container) {
            console.error("PDF viewer container not found");
            return;
        }

        container.innerHTML = "Loading annotations...";

        fetch(annotationUrl, {
            headers: {
                "Authorization": "Bearer " + token
            }
        })
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Unable to load annotations");
            }

            return response.json();
        })
        .then(function (annotations) {

            this.viewer.show(
                container,
                pdfUrl,
                token,
                annotations
            );

        }.bind(this))
        .catch(function (error) {
            container.innerHTML = "";
            var message = document.createElement("p");
            message.textContent = error.message;
            container.appendChild(message);
            console.error(error);
        });
    };

    return PdfViewerController;
});

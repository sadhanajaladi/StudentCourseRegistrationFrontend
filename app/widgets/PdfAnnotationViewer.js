
define([], function () {

    function PdfAnnotationViewer() {}

    PdfAnnotationViewer.prototype.show = function (container, pdfUrl, token, annotations) {

        container.innerHTML = "";

        var loadingMessage = document.createElement("p");
        loadingMessage.textContent = "Loading PDF...";
        container.appendChild(loadingMessage);

        fetch(pdfUrl, {
            headers: {
                "Authorization": "Bearer " + token
            }
        })
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Unable to load PDF");
            }
            return response.arrayBuffer();
        })
        .then(function (data) {

            return pdfjsLib.getDocument({
                data: data
            }).promise;

        })
        .then(function (pdf) {

            container.innerHTML = "";

            for (var pageNumber = 1;
                 pageNumber <= pdf.numPages;
                 pageNumber++) {

                renderPage(pdf, pageNumber, container, annotations || []);
            }

        })
        .catch(function (error) {
            container.innerHTML = "";
            var message = document.createElement("p");
            message.textContent = error.message;
            container.appendChild(message);
            console.error(error);
        });
    };

    function renderPage(pdf, pageNumber, container, annotations) {

        pdf.getPage(pageNumber).then(function (page) {

            var scale = 1.2;
            var viewport = page.getViewport({ scale: scale });

            var pageContainer = document.createElement("div");
            pageContainer.style.position = "relative";
            pageContainer.style.width = viewport.width + "px";
            pageContainer.style.margin = "20px auto";
            pageContainer.style.border = "1px solid #ccc";

            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            pageContainer.appendChild(canvas);
            container.appendChild(pageContainer);

            page.render({
                canvasContext: context,
                viewport: viewport
            }).promise.then(function () {

                annotations.forEach(function (annotation) {

                    if (annotation.pageNumber !== pageNumber) {
                        return;
                    }

                    var overlay = document.createElement("div");

                    overlay.style.position = "absolute";
                    overlay.style.left =
                        (annotation.x * viewport.width) + "px";
                    overlay.style.top =
                        (annotation.y * viewport.height) + "px";
                    overlay.style.width =
                        (annotation.width * viewport.width) + "px";
                    overlay.style.height =
                        (annotation.height * viewport.height) + "px";

                    if (annotation.type === "CIRCLE") {
                        overlay.style.border = "3px solid red";
                        overlay.style.borderRadius = "50%";
                    }

                    if (annotation.type === "HIGHLIGHT") {
                        overlay.style.backgroundColor =
                            "rgba(255, 255, 0, 0.4)";
                    }

                    if (annotation.type === "MASK") {
                        overlay.style.backgroundColor = "black";
                    }

                    pageContainer.appendChild(overlay);
                });

            });

        });
    }

    PdfAnnotationViewer.prototype.createContainer = function (parent) {

    var viewer = document.createElement("div");

    viewer.id = "pdf-viewer";
    viewer.style.width = "100%";
    viewer.style.maxHeight = "700px";
    viewer.style.overflow = "auto";
    viewer.style.padding = "15px";
    viewer.style.backgroundColor = "#f5f5f5";
    viewer.style.border = "1px solid #ddd";
    viewer.style.borderRadius = "8px";

    var message = document.createElement("p");
    message.textContent = "Select a document version to view its PDF.";

    viewer.appendChild(message);
    parent.appendChild(viewer);

    return viewer;
};

    return PdfAnnotationViewer;
});

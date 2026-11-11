define([
    "dojo/dom-construct",
    "app/services/Logger"
], function (domConstruct, Logger) {
    function PdfAnnotationViewer() {}

    PdfAnnotationViewer.prototype.render = function (parent, pdfUrl, token, annotations, docTitle) {
        parent.innerHTML = "";

        var container = domConstruct.create("div", {
            className: "card shadow-sm border-0 mb-4"
        }, parent);

        var header = domConstruct.create("div", {
            className: "card-header bg-dark text-white d-flex justify-content-between align-items-center py-2 px-3",
            innerHTML: '<div class="d-flex align-items-center">' +
                '<span class="badge bg-danger me-2">Annotated File</span>' +
                '<span class="fw-semibold">' + (docTitle || "Document Preview") + '</span>' +
                '</div>' +
                '<span class="badge bg-secondary">' + ((annotations || []).length) + ' Annotation(s)</span>'
        }, container);

        var body = domConstruct.create("div", {
            className: "card-body p-3 bg-light",
            style: "max-height: 750px; overflow-y: auto;"
        }, container);

        var statusNode = domConstruct.create("div", {
            className: "text-center py-4 text-muted",
            innerHTML: '<div class="spinner-border text-primary spinner-border-sm me-2" role="status"></div> Loading document pages and rendering annotations...'
        }, body);

        Logger.info("PdfAnnotationViewer", "Loading PDF from " + pdfUrl + " with " + ((annotations || []).length) + " annotations");

        fetch(pdfUrl, {
            headers: token ? { "Authorization": "Bearer " + token } : {}
        })
        .then(function (res) {
            if (!res.ok) throw new Error("PDF download failed with status " + res.status);
            return res.arrayBuffer();
        })
        .then(function (data) {
            if (typeof pdfjsLib === "undefined") {
                throw new Error("PDF.js library is not loaded.");
            }
            return pdfjsLib.getDocument({ data: data }).promise;
        })
        .then(function (pdf) {
            body.innerHTML = "";
            var pagesContainer = domConstruct.create("div", { className: "d-flex flex-column align-items-center" }, body);

            var renderPromises = [];
            for (var pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                renderPromises.push(renderPage(pdf, pageNum, pagesContainer, annotations || []));
            }
            return Promise.all(renderPromises);
        })
        .then(function () {
            Logger.info("PdfAnnotationViewer", "All PDF pages and annotations rendered successfully");
        })
        .catch(function (err) {
            body.innerHTML = '<div class="alert alert-danger mb-0"><i class="bi bi-exclamation-triangle-fill me-2"></i>Unable to display annotated PDF: ' + (err.message || err) + '</div>';
            Logger.error("PdfAnnotationViewer", "PDF rendering error", err);
        });
    };

    function renderPage(pdf, pageNum, parent, annotations) {
        return pdf.getPage(pageNum).then(function (page) {
            var scale = 1.25;
            var viewport = page.getViewport({ scale: scale });

            var pageWrapper = domConstruct.create("div", {
                className: "pdf-page-container mb-4 position-relative bg-white",
                style: "width: " + viewport.width + "px; max-width: 100%; box-shadow: 0 4px 10px rgba(0,0,0,0.15); border: 1px solid #ced4da;"
            }, parent);

            var canvas = domConstruct.create("canvas", {
                width: viewport.width,
                height: viewport.height,
                style: "display: block; width: 100%; height: auto;"
            }, pageWrapper);

            var ctx = canvas.getContext("2d");

            return page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise.then(function () {
                var pageAnnotations = annotations.filter(function (a) {
                    return Number(a.pageNumber) === pageNum;
                });

                pageAnnotations.forEach(function (a) {
                    var left = (Number(a.x || 0) * viewport.width);
                    var top = (Number(a.y || 0) * viewport.height);
                    var width = (Number(a.width || 0.1) * viewport.width);
                    var height = (Number(a.height || 0.05) * viewport.height);

                    var overlay = domConstruct.create("div", {
                        className: "annotation-overlay",
                        style: "left:" + left + "px; top:" + top + "px; width:" + width + "px; height:" + height + "px;"
                    }, pageWrapper);

                    var type = String(a.type || "").toUpperCase();
                    if (type === "CIRCLE") {
                        overlay.style.border = "3px solid #dc3545";
                        overlay.style.borderRadius = "50%";
                        overlay.style.backgroundColor = "rgba(220, 53, 69, 0.12)";
                    } else if (type === "HIGHLIGHT") {
                        overlay.style.backgroundColor = "rgba(255, 235, 59, 0.45)";
                        overlay.style.border = "1px dashed #eab308";
                    } else if (type === "MASK") {
                        overlay.style.backgroundColor = "#212529";
                    } else {
                        overlay.style.border = "2px solid #0d6efd";
                        overlay.style.backgroundColor = "rgba(13, 110, 253, 0.15)";
                    }

                    if (a.comment || a.createdBy) {
                        var tooltip = domConstruct.create("div", {
                            className: "annotation-tooltip",
                            innerHTML: '<strong>' + (a.createdBy || "Student") + ':</strong> ' + (a.comment || a.type)
                        }, overlay);
                    }
                });
            });
        });
    }

    return PdfAnnotationViewer;
});

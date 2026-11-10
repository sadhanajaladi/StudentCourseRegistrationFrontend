
define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/on",
    "app/controllers/PdfViewerController",
    "app/controllers/DocumentManagementController"
], function (declare, dom, on, PdfViewerController, DocumentManagementController) {

    return declare(null, {

        constructor: function () {
            this.manager = new DocumentManagementController();
            this.pdfViewer = new PdfViewerController();
        },

        render: function (parent) {
            var self = this;
            parent.innerHTML = "";

            var container = dom.create("div", {
                style: "padding:20px;"
            }, parent);

            dom.create("h2", {
                innerHTML: "Document Management"
            }, container);

            // Document name
            var name = dom.create("input", {
                placeholder: "Document name",
                style: "margin:5px;padding:8px;"
            }, container);

            // Document type dropdown
            var type = dom.create("select", {
                style: "margin:5px;padding:8px;"
            }, container);

            [
                { value: "", label: "Select Document Type" },
                { value: "ID_PROOF", label: "ID Proof" },
                { value: "MARKSHEET", label: "Marksheet" },
                { value: "DEGREE_CERTIFICATE", label: "Degree Certificate" },
                { value: "OTHER", label: "Other" }
            ].forEach(function (option) {
                dom.create("option", {
                    value: option.value,
                    innerHTML: option.label
                }, type);
            });

            // File selection
            var file = dom.create("input", {
                type: "file",
                style: "margin:5px;"
            }, container);

            var upload = dom.create("button", {
                innerHTML: "Upload Document"
            }, container);

            var message = dom.create("p", {}, container);

            dom.create("h3", {
                innerHTML: "My Documents"
            }, container);

            var list = dom.create("div", {}, container);

            // PDF Viewer
            dom.create("h3", {
                innerHTML: "PDF Viewer"
            }, container);

            var viewerArea = dom.create("div", {}, container);
            this.pdfViewer.initialize(viewerArea);

            // Reusable button
            function button(parent, label, callback) {
                var btn = dom.create("button", {
                    innerHTML: label,
                    style: "margin:5px;padding:7px;"
                }, parent);

                on(btn, "click", callback);
                return btn;
            }

            // Load documents
            function loadDocuments() {
                list.innerHTML = "Loading...";

                self.manager.loadDocuments().then(function (documents) {
                    list.innerHTML = "";

                    // Remove duplicate filename and type records.
                    // Keep the record with the highest current version.
                    var uniqueDocuments = {};

                    documents.forEach(function (doc) {
                        var key = (doc.name || "").trim().toLowerCase() +
                            "|" + (doc.type || "").trim().toLowerCase();

                        var existing = uniqueDocuments[key];

                        if (!existing ||
                            Number(doc.currentVersion || 0) >
                            Number(existing.currentVersion || 0)) {

                            uniqueDocuments[key] = doc;
                        }
                    });

                    var finalDocuments = Object.keys(uniqueDocuments).map(
                        function (key) {
                            return uniqueDocuments[key];
                        }
                    );

                    if (!finalDocuments.length) {
                        list.innerHTML = "No documents uploaded.";
                        return;
                    }

                    finalDocuments.forEach(function (doc) {

                        var item = dom.create("div", {
                            style: "padding:12px;border:1px solid #ddd;margin:10px 0;"
                        }, list);

                        dom.create("h4", {
                            innerHTML: doc.name
                        }, item);

                        dom.create("p", {
                            innerHTML: "Type: " + doc.type
                        }, item);

                        dom.create("p", {
                            innerHTML: "Latest Version: " + doc.currentVersion
                        }, item);

                        dom.create("p", {
                            innerHTML: doc.checkedOut
                                ? "Checked out by: " + doc.checkedOutBy
                                : "Available for editing"
                        }, item);

                        // Checkout
                        if (!doc.checkedOut) {

                            button(item, "Checkout", function () {
                                self.manager.checkoutDocument(doc.id)
                                    .then(loadDocuments)
                                    .catch(showError);
                            });

                        } else {

                            // Check-in
                            var checkinFile = dom.create("input", {
                                type: "file"
                            }, item);

                            button(item, "Check-in", function () {
                                if (!checkinFile.files[0]) {
                                    alert("Select the updated file.");
                                    return;
                                }

                                self.manager.checkinDocument(
                                    doc.id,
                                    checkinFile.files[0]
                                ).then(loadDocuments).catch(showError);
                            });
                        }

                        // Upload new version
                        var versionFile = dom.create("input", {
                            type: "file"
                        }, item);

                        button(item, "Upload New Version", function () {
                            if (!versionFile.files[0]) {
                                alert("Select a file.");
                                return;
                            }

                            if (doc.checkedOut) {
                                alert("Document is checked out by " + doc.checkedOutBy);
                                return;
                            }

                            self.manager.uploadNewVersion(
                                doc.id,
                                versionFile.files[0]
                            ).then(loadDocuments).catch(showError);
                        });

                        // Version History
                        dom.create("h4", {
                            innerHTML: "Version History"
                        }, item);

                        (doc.versions || []).forEach(function (version) {

                            var row = dom.create("div", {
                                style: "padding:5px;border-bottom:1px solid #eee;"
                            }, item);

                            dom.create("span", {
                                innerHTML: "Version " + version.versionNumber +
                                    " - " + version.originalFileName
                            }, row);

                            if (Number(version.versionNumber) ===
                                Number(doc.currentVersion)) {
                                dom.create("strong", {
                                    innerHTML: " (Latest)"
                                }, row);
                            }

                            button(row, "View PDF", function () {
                                self.pdfViewer.openVersion(
                                    doc.id,
                                    version.versionNumber
                                );
                            });
                        });
                    });

                }).catch(showError);
            }

            function showError(error) {
                message.innerHTML = error.message || "Operation failed.";
            }

            // Upload first document
            on(upload, "click", function () {

                if (!name.value.trim() || !type.value || !file.files[0]) {
                    message.innerHTML =
                        "Enter document name, select document type and choose a file.";
                    return;
                }

                upload.disabled = true;
                message.innerHTML = "Uploading...";

                self.manager.uploadDocument(
                    name.value.trim(),
                    type.value,
                    file.files[0]
                ).then(function () {

                    message.innerHTML = "Document uploaded successfully!";

                    name.value = "";
                    type.value = "";
                    file.value = "";

                    return loadDocuments();

                }).catch(showError).finally(function () {
                    upload.disabled = false;
                });
            });

            loadDocuments();
        }
    });
});

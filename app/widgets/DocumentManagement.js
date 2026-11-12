define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/on",
    "dojo/store/Memory",
    "dojo/data/ObjectStore",
    "dojox/grid/EnhancedGrid",
    "dijit/form/ValidationTextBox",
    "dijit/form/Select",
    "dijit/form/Button",
    "app/widgets/PdfAnnotationViewer",
    "app/widgets/ConfirmDialog",
    "app/controllers/DocumentManagementController",
    "app/services/Api",
    "app/services/Logger",
    "app/services/Properties"
], function (declare, domConstruct, on, Memory, ObjectStore, EnhancedGrid, ValidationTextBox, Select, Button, PdfAnnotationViewer, ConfirmDialog, DocumentManagementController,api, Logger, Properties) {

    return declare(null, {
        constructor: function () {
            this.manager = new DocumentManagementController();
            this.pdfViewer = new PdfAnnotationViewer();
            this.grid = null;
        },

        render: function (parent) {
            var self = this;
            parent.innerHTML = [
                '<div class="container-fluid px-0">',
                '<div class="card shadow-sm border-0 mb-4">',
                '<div class="card-header bg-white py-3 border-bottom">',
                '<h5 class="card-title fw-bold text-primary mb-0">Upload New Document</h5>',
                '</div>',
                '<div class="card-body">',
                '<div class="row g-3 align-items-end" id="uploadFormSlot">',
                '<div class="col-md-4">',
                '<label class="form-label fw-semibold text-secondary">Document Name</label>',
                '<div id="docNameSlot"></div>',
                '</div>',
                '<div class="col-md-3">',
                '<label class="form-label fw-semibold text-secondary">Document Type</label>',
                '<div id="docTypeSlot"></div>',
                '</div>',
                '<div class="col-md-3">',
                '<label class="form-label fw-semibold text-secondary">Select PDF File</label>',
                '<input type="file" id="docFileInput" class="form-control" accept=".pdf">',
                '</div>',
                '<div class="col-md-2" id="uploadBtnSlot"></div>',
                '</div>',
                '<div id="uploadNotice" class="mt-3"></div>',
                '</div></div>',
                '<div class="card shadow-sm border-0 mb-4">',
                '<div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">',
                '<h5 class="card-title fw-bold text-primary mb-0">My Uploaded Documents</h5>',
                '<div id="refreshDocsSlot"></div>',
                '</div>',
                '<div class="card-body">',
                '<div id="studentDocGridSlot" style="height: 240px; width: 100%;"></div>',
                '</div></div>',
                '<div id="studentPdfViewerArea" class="mt-4"></div>',
                '</div>'
            ].join("");

            // Name Input
            var nameInput = new ValidationTextBox({
                placeHolder: "e.g. Identity Proof / Marksheet",
                required: true,
                trim: true,
                style: "width: 100%;"
            }, domConstruct.create("input", {}, parent.querySelector("#docNameSlot")));
            nameInput.startup();

            // Type Select
            var typeSelect = new Select({
                options: [
                    { label: "Select Type...", value: "" },
                    { label: "ID Proof", value: "ID_PROOF" },
                    { label: "Marksheet", value: "MARKSHEET" },
                    { label: "Degree Certificate", value: "DEGREE_CERTIFICATE" },
                    { label: "Other", value: "OTHER" }
                ],
                style: "width: 100%;"
            }, domConstruct.create("div", {}, parent.querySelector("#docTypeSlot")));
            typeSelect.startup();

            // Upload Button
            var uploadBtn = new Button({
                label: Properties.get("btn.upload", "Upload"),
                class: "btn btn-primary w-100 fw-bold",
                onClick: function () {
                    var nameVal = nameInput.get("value");
                    var typeVal = typeSelect.get("value");
                    var fileEl = parent.querySelector("#docFileInput");
                    var file = fileEl.files[0];
                    var notice = parent.querySelector("#uploadNotice");

                    if (!nameVal || !typeVal || !file) {
                        notice.innerHTML = '<div class="alert alert-warning py-2 mb-0">Please fill document name, select type, and pick a PDF file.</div>';
                        return;
                    }

                    uploadBtn.set("disabled", true);
                    uploadBtn.set("label", "Uploading...");
                    Logger.info("DocumentManagement", "Uploading document: " + nameVal + " (" + typeVal + ")");

                    self.manager.uploadDocument(nameVal, typeVal, file)
                        .then(function () {
                            notice.innerHTML = '<div class="alert alert-success py-2 mb-0">Document uploaded successfully!</div>';
                            nameInput.reset();
                            typeSelect.set("value", "");
                            fileEl.value = "";
                            self.loadDocuments(parent);
                        })
                        .catch(function (err) {
                            Logger.error("DocumentManagement", "Upload failed", err);
                            notice.innerHTML = '<div class="alert alert-danger py-2 mb-0">Upload failed: ' + (err.message || err) + '</div>';
                        })
                        .finally(function () {
                            uploadBtn.set("disabled", false);
                            uploadBtn.set("label", Properties.get("btn.upload", "Upload"));
                        });
                }
            }, domConstruct.create("button", {}, parent.querySelector("#uploadBtnSlot")));
            uploadBtn.startup();

            // Refresh Button
            var refreshBtn = new Button({
                label: "Refresh Documents",
                class: "btn btn-outline-secondary btn-sm",
                onClick: function () { self.loadDocuments(parent); }
            }, domConstruct.create("button", {}, parent.querySelector("#refreshDocsSlot")));
            refreshBtn.startup();

            this.loadDocuments(parent);
        },

        loadDocuments: function (parent) {
            var self = this;
            var slot = parent.querySelector("#studentDocGridSlot");
            slot.innerHTML = '<div class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm me-2"></div> Loading documents...</div>';

            this.manager.loadDocuments()
                .then(function (docs) {
                    slot.innerHTML = "";
                    docs = docs || [];

                    if (!docs.length) {
                        slot.innerHTML = '<div class="alert alert-light border py-3 text-center">No documents uploaded yet. Upload your first document above.</div>';
                        return;
                    }

                    var rows = docs.map(function (d) {
                        return {
                            id: d.id,
                            name: d.name,
                            type: d.type,
                            version: "v" + (d.currentVersion || 1),
                            status: d.checkedOut ? ("Checked out by " + d.checkedOutBy) : "Available",
                            rawDoc: d
                        };
                    });

                    var store = new Memory({ data: rows, idProperty: "id" });
                    if (self.grid && !self.grid._destroyed) self.grid.destroy();

                    self.grid = new EnhancedGrid({
                        store: new ObjectStore({ objectStore: store }),
                        structure: [[
                            { name: "ID", field: "id", width: "10%" },
                            { name: "Document Title", field: "name", width: "35%" },
                            { name: "Type", field: "type", width: "20%" },
                            { name: "Version", field: "version", width: "15%" },
                            { name: "Status", field: "status", width: "20%" }
                        ]],
                        autoHeight: true,
                        selectionMode: "single"
                    }, domConstruct.create("div", { style: "height: 220px; width: 100%;" }, slot));

                    self.grid.startup();

                    on(self.grid, "RowClick", function (evt) {
                        var item = self.grid.getItem(evt.rowIndex);
                        if (!item) return;
                        var docId = self.grid.store.getValue(item, "id");
                        var selected = docs.find(function (d) { return String(d.id) === String(docId); });
                        if (selected) self.previewDocument(parent, selected);
                    });
                })
                .catch(function (err) {
                    Logger.error("DocumentManagement", "Failed to load documents", err);
                    slot.innerHTML = '<div class="alert alert-danger">Error loading documents: ' + (err.message || err) + '</div>';
                });
        },

        previewDocument: function (parent, doc) {
            var viewerSlot = parent.querySelector("#studentPdfViewerArea");
            var pdfUrl = Properties.get("app.api.base-url") + "/documents/" + doc.id + "/versions/" + doc.currentVersion + "/download";
            var token = localStorage.getItem("jwtToken");

            Logger.info("DocumentManagement", "Displaying document v" + doc.currentVersion + " with annotations");

            // Fetch annotations
            api.get("/documents/" + doc.id + "/versions/" + doc.currentVersion + "/annotations")
                .then(function (annotations) {
                    this.pdfViewer.render(viewerSlot, pdfUrl, token, annotations || [], doc.name + " (Version " + doc.currentVersion + ")");
                }.bind(this))
                .catch(function () {
                    this.pdfViewer.render(viewerSlot, pdfUrl, token, [], doc.name + " (Version " + doc.currentVersion + ")");
                }.bind(this));
        }
    });
});

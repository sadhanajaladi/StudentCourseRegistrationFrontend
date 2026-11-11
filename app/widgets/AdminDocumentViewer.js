define([
    "dojo/dom-construct",
    "dojo/on",
    "dojo/store/Memory",
    "dojo/data/ObjectStore",
    "dojox/grid/DataGrid",
    "dijit/form/TextBox",
    "dijit/form/Button",
    "app/widgets/PdfAnnotationViewer",
    "app/services/Api",
    "app/services/Logger",
    "app/services/Properties"
], function (domConstruct, on, Memory, ObjectStore, DataGrid, TextBox, Button, PdfAnnotationViewer, api, Logger, Properties) {

    function AdminDocumentViewer() {
        this.students = [];
        this.documents = [];
        this.grids = [];
        this.pdfViewer = new PdfAnnotationViewer();
    }

    AdminDocumentViewer.prototype.placeAt = function (parent) {
        this.parent = parent;
        parent.innerHTML = [
            '<div class="container-fluid px-0">',
            '<div class="card shadow-sm border-0 mb-4">',
            '<div class="card-header bg-white py-3 border-bottom">',
            '<h5 class="card-title fw-bold text-primary mb-0">Search Student Documents & Annotations</h5>',
            '</div>',
            '<div class="card-body">',
            '<div class="row g-3 align-items-center mb-3">',
            '<div class="col-md-5">',
            '<label class="form-label fw-semibold text-secondary" for="adminStudentSearch">Filter by Student Name or Email</label>',
            '<div id="adminStudentSearchSlot"></div>',
            '</div>',
            '<div class="col-md-7">',
            '<label class="form-label fw-semibold text-secondary">Matching Students (Select to view documents)</label>',
            '<div id="studentGridSlot" style="height: 160px; width: 100%;"></div>',
            '</div></div>',
            '<div id="selectedStudentBanner" class="alert alert-primary d-none py-2 px-3 fw-semibold"></div>',
            '<h6 class="fw-bold text-dark mt-4 mb-2">Student Documents</h6>',
            '<div id="documentGridSlot" style="height: 180px; width: 100%;"></div>',
            '<div id="documentDetailsArea" class="mt-4"></div>',
            '</div></div></div>'
        ].join("");

        var searchHost = parent.querySelector("#adminStudentSearchSlot");
        this.searchWidget = new TextBox({
            placeHolder: "Type student name or email...",
            intermediateChanges: true,
            trim: true,
            style: "width: 100%;"
        }, domConstruct.create("input", {}, searchHost));
        this.searchWidget.startup();

        this.banner = parent.querySelector("#selectedStudentBanner");
        this.detailsArea = parent.querySelector("#documentDetailsArea");

        var self = this;
        on(this.searchWidget, "change", function (val) {
            self.filterStudents(val);
        });

        this.loadInitialData();
    };

    AdminDocumentViewer.prototype.loadInitialData = function () {
        var self = this;
        Logger.info("AdminDocumentViewer", "Fetching students and all document records");
        Promise.all([api.get("/admin/students"), api.get("/documents/admin/all")])
            .then(function (results) {
                self.students = results[0] || [];
                self.documents = results[1] || [];
                Logger.info("AdminDocumentViewer", "Loaded " + self.students.length + " students and " + self.documents.length + " documents");
                self.filterStudents("");
            })
            .catch(function (err) {
                Logger.error("AdminDocumentViewer", "Failed to load document viewer data", err);
                self.detailsArea.innerHTML = '<div class="alert alert-danger">Error loading student documents: ' + (err.message || err) + '</div>';
            });
    };

    AdminDocumentViewer.prototype.filterStudents = function (term) {
        var self = this;
        var query = String(term || "").toLowerCase().trim();
        var matches = this.students.filter(function (s) {
            return (String(s.name || "") + " " + String(s.email || "")).toLowerCase().indexOf(query) >= 0;
        });

        var store = new Memory({ data: matches, idProperty: "id" });
        var slot = this.parent.querySelector("#studentGridSlot");
        slot.innerHTML = "";

        if (!matches.length) {
            slot.innerHTML = '<div class="alert alert-light border py-2">No matching students found.</div>';
            return;
        }

        var grid = new DataGrid({
            store: new ObjectStore({ objectStore: store }),
            structure: [[
                { name: "ID", field: "id", width: "15%" },
                { name: "Student Name", field: "name", width: "40%" },
                { name: "Email Address", field: "email", width: "45%" }
            ]],
            autoHeight: true,
            selectionMode: "single"
        }, domConstruct.create("div", { style: "height: 150px; width: 100%;" }, slot));

        grid.startup();
        this.grids.push(grid);

        on(grid, "RowClick", function (evt) {
            var item = grid.getItem(evt.rowIndex);
            if (!item) return;
            var studentId = grid.store.getValue(item, "id");
            var student = self.students.find(function (s) { return String(s.id) === String(studentId); });
            if (student) self.selectStudent(student);
        });
    };

    AdminDocumentViewer.prototype.selectStudent = function (student) {
        this.selectedStudent = student;
        this.banner.classList.remove("d-none");
        this.banner.innerHTML = '<i class="bi bi-person-check-fill me-2"></i>Selected Student: <strong>' +
            student.name + '</strong> (' + student.email + ')';

        var docs = this.documents.filter(function (d) {
            return String(d.ownerEmail || "").toLowerCase() === String(student.email || "").toLowerCase();
        });

        var slot = this.parent.querySelector("#documentGridSlot");
        slot.innerHTML = "";
        this.detailsArea.innerHTML = "";

        if (!docs.length) {
            slot.innerHTML = '<div class="alert alert-warning py-2">No documents uploaded by this student.</div>';
            return;
        }

        var store = new Memory({ data: docs, idProperty: "id" });
        var self = this;
        var docGrid = new DataGrid({
            store: new ObjectStore({ objectStore: store }),
            structure: [[
                { name: "Doc ID", field: "id", width: "12%" },
                { name: "Document Title", field: "name", width: "38%" },
                { name: "Document Type", field: "type", width: "25%" },
                { name: "Latest Version", field: "currentVersion", width: "25%" }
            ]],
            autoHeight: true,
            selectionMode: "single"
        }, domConstruct.create("div", { style: "height: 170px; width: 100%;" }, slot));

        docGrid.startup();
        this.grids.push(docGrid);

        on(docGrid, "RowClick", function (evt) {
            var item = docGrid.getItem(evt.rowIndex);
            if (!item) return;
            var docId = docGrid.store.getValue(item, "id");
            var doc = docs.find(function (d) { return String(d.id) === String(docId); });
            if (doc) self.showDocumentDetails(doc);
        });
    };

    AdminDocumentViewer.prototype.showDocumentDetails = function (doc) {
        var self = this;
        this.detailsArea.innerHTML = [
            '<div class="card shadow-sm border-0 mb-3">',
            '<div class="card-header bg-primary text-white d-flex justify-content-between align-items-center py-2 px-3">',
            '<div><span class="fw-bold">Original Document:</span> ' + doc.name + ' (' + doc.type + ') - Version ' + doc.currentVersion + '</div>',
            '<div id="docHeaderButtons"></div>',
            '</div>',
            '<div class="card-body p-3">',
            '<div class="row mb-3">',
            '<div class="col-md-3"><strong>Owner:</strong> ' + doc.ownerEmail + '</div>',
            '<div class="col-md-3"><strong>Type:</strong> ' + doc.type + '</div>',
            '<div class="col-md-3"><strong>Version:</strong> v' + doc.currentVersion + '</div>',
            '<div class="col-md-3"><strong>Checked Out:</strong> ' + (doc.checkedOut ? ('Yes (' + doc.checkedOutBy + ')') : 'No') + '</div>',
            '</div>',
            '<div id="annotatedPdfViewerSlot" class="mt-3"></div>',
            '<div class="mt-4"><h6 class="fw-bold text-secondary">Student Annotations History</h6>',
            '<div id="annotationsGridSlot" style="height: 180px; width: 100%;"></div></div>',
            '</div></div>'
        ].join("");

        // Open raw PDF in popup button
        var headerBtnSlot = this.detailsArea.querySelector("#docHeaderButtons");
        var openRawBtn = new Button({
            label: "Open Raw PDF in New Tab",
            class: "btn btn-outline-light btn-sm fw-semibold",
            onClick: function () {
                var token = localStorage.getItem("jwtToken");
                var url = Properties.get("app.api.base-url") + "/documents/" + doc.id + "/versions/" + doc.currentVersion + "/download";
                window.open(url, "_blank");
            }
        }, domConstruct.create("button", {}, headerBtnSlot));
        openRawBtn.startup();

        // Load annotations for the document
        Logger.info("AdminDocumentViewer", "Fetching annotations for document ID: " + doc.id);
        api.get("/documents/" + doc.id + "/versions/" + doc.currentVersion + "/annotations")
            .then(function (annotations) {
                annotations = annotations || [];
                Logger.info("AdminDocumentViewer", "Found " + annotations.length + " annotations for doc " + doc.id);

                // 1. Render VISUAL ANNOTATED PDF below the original doc tab
                var pdfSlot = self.detailsArea.querySelector("#annotatedPdfViewerSlot");
                var pdfUrl = Properties.get("app.api.base-url") + "/documents/" + doc.id + "/versions/" + doc.currentVersion + "/download";
                var token = localStorage.getItem("jwtToken");
                self.pdfViewer.render(pdfSlot, pdfUrl, token, annotations, doc.name + " (Version " + doc.currentVersion + ")");

                // 2. Render ANNOTATION GRID below
                var annotGridSlot = self.detailsArea.querySelector("#annotationsGridSlot");
                annotGridSlot.innerHTML = "";

                if (!annotations.length) {
                    annotGridSlot.innerHTML = '<div class="alert alert-info py-2">No student annotations found for this document.</div>';
                    return;
                }

                var formattedAnnotations = annotations.map(function (a, idx) {
                    return {
                        id: a.id || idx,
                        type: a.type,
                        pageNumber: a.pageNumber,
                        comment: a.comment || "N/A",
                        createdBy: a.createdBy || "Student",
                        createdAt: a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"
                    };
                });

                var store = new Memory({ data: formattedAnnotations, idProperty: "id" });
                var annotGrid = new DataGrid({
                    store: new ObjectStore({ objectStore: store }),
                    structure: [[
                        { name: "ID", field: "id", width: "8%" },
                        { name: "Type", field: "type", width: "15%" },
                        { name: "Page #", field: "pageNumber", width: "10%" },
                        { name: "Comment", field: "comment", width: "35%" },
                        { name: "Created By", field: "createdBy", width: "17%" },
                        { name: "Created At", field: "createdAt", width: "15%" }
                    ]],
                    autoHeight: true
                }, domConstruct.create("div", { style: "height: 160px; width: 100%;" }, annotGridSlot));

                annotGrid.startup();
                self.grids.push(annotGrid);
            })
            .catch(function (err) {
                Logger.error("AdminDocumentViewer", "Failed to fetch annotations", err);
                self.detailsArea.querySelector("#annotatedPdfViewerSlot").innerHTML =
                    '<div class="alert alert-warning">Unable to load annotations: ' + (err.message || err) + '</div>';
            });
    };

    return AdminDocumentViewer;
});

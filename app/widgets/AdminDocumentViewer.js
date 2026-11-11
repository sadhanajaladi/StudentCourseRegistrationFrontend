
define([
    "app/services/Api",
    "app/config"
], function (Api, config) {

    function AdminDocumentViewer() {
        this.students = [];
        this.documents = [];
        this.selectedStudent = null;
    }

    AdminDocumentViewer.prototype.placeAt = function (parent) {
        var self = this;

        this.parent = parent;

        parent.innerHTML = `
            <section class="admin-document-viewer">
                <h2>Student Documents</h2>

                <label for="adminStudentSearch">
                    Search Student
                </label>

                <input
                    type="text"
                    id="adminStudentSearch"
                    placeholder="Type student name..."
                    autocomplete="off"
                >

                <div id="studentSearchResults"></div>

                <div id="selectedStudentInfo"></div>

                <div id="adminStudentDocuments">
                    <p>Search and select a student to view documents.</p>
                </div>

                <div id="adminPdfMessage"></div>
            </section>
        `;

        this.searchInput =
            parent.querySelector("#adminStudentSearch");

        this.searchResults =
            parent.querySelector("#studentSearchResults");

        this.documentsContainer =
            parent.querySelector("#adminStudentDocuments");

        this.selectedInfo =
            parent.querySelector("#selectedStudentInfo");

        this.message =
            parent.querySelector("#adminPdfMessage");

        this.bindEvents();
        this.loadData();
    };

    AdminDocumentViewer.prototype.bindEvents = function () {
        var self = this;

        this.searchInput.addEventListener("input", function () {
            self.showStudentMatches(this.value.trim());
        });

        this.searchResults.addEventListener("click", function (event) {
            var button = event.target.closest("[data-student-id]");

            if (!button) return;

            var studentId = Number(button.dataset.studentId);

            var student = self.students.find(function (item) {
                return Number(item.id) === studentId;
            });

            if (student) {
                self.selectStudent(student);
            }
        });

        this.documentsContainer.addEventListener("click", function (event) {
            var button = event.target.closest("[data-document-id]");

            if (!button) return;

            var documentId = Number(button.dataset.documentId);

            if (button.dataset.action === "versions") {
                self.loadVersions(documentId, button);
            }

            if (button.dataset.action === "view") {
                var versionNumber = Number(button.dataset.version);
                self.viewPdf(documentId, versionNumber);
            }
        });
    };

    AdminDocumentViewer.prototype.loadData = function () {
        var self = this;

        Promise.all([
            Api.get("/admin/students"),
            Api.get("/documents/admin/all")
        ])
        .then(function (results) {
            self.students = results[0] || [];
            self.documents = results[1] || [];

            console.log("Admin students:", self.students);
            console.log("Admin documents:", self.documents);
        })
        .catch(function (error) {
            console.error("Unable to load admin documents:", error);
            self.documentsContainer.textContent =
                "Unable to load students or documents: " + error.message;
        });
    };

    AdminDocumentViewer.prototype.showStudentMatches = function (searchText) {
        var self = this;

        this.searchResults.innerHTML = "";
        this.selectedInfo.innerHTML = "";

        if (!searchText) {
            this.searchResults.textContent = "";
            return;
        }

        var search = searchText.toLowerCase();

        var matches = this.students.filter(function (student) {
            return (student.name || "").toLowerCase().startsWith(search);
        });

        if (matches.length === 0) {
            this.searchResults.textContent = "No matching students found.";
            return;
        }

        matches.forEach(function (student) {
            var button = document.createElement("button");

            button.type = "button";
            button.dataset.studentId = student.id;
            button.textContent = student.name + " (" + student.email + ")";

            button.style.display = "block";
            button.style.margin = "6px 0";
            button.style.padding = "8px 12px";
            button.style.cursor = "pointer";

            self.searchResults.appendChild(button);
        });
    };

    AdminDocumentViewer.prototype.selectStudent = function (student) {
        this.selectedStudent = student;

        this.searchInput.value = student.name;
        this.searchResults.innerHTML = "";

        this.selectedInfo.textContent =
            "Selected student: " + student.name +
            " | " + student.email;

        this.showStudentDocuments();
    };

    AdminDocumentViewer.prototype.showStudentDocuments = function () {
        var self = this;

        this.documentsContainer.innerHTML = "";

        var studentDocuments = this.documents.filter(function (doc) {
            return (doc.ownerEmail || "").toLowerCase() ===
                (self.selectedStudent.email || "").toLowerCase();
        });

        if (studentDocuments.length === 0) {
            this.documentsContainer.textContent =
                "No documents found for this student.";
            return;
        }

        studentDocuments.forEach(function (doc) {
            var card = document.createElement("div");
            card.className = "admin-document-card";

            var heading = document.createElement("h3");
            heading.textContent = doc.name || "Untitled document";

            var type = document.createElement("p");
            type.textContent = "Document type: " + (doc.type || "N/A");

            var button = document.createElement("button");
            button.type = "button";
            button.dataset.action = "versions";
            button.dataset.documentId = doc.id;
            button.textContent = "View Version History";

            var versionsArea = document.createElement("div");
            versionsArea.id = "versions-" + doc.id;

            card.appendChild(heading);
            card.appendChild(type);
            card.appendChild(button);
            card.appendChild(versionsArea);

            self.documentsContainer.appendChild(card);
        });
    };

    AdminDocumentViewer.prototype.loadVersions = function (
        documentId,
        button
    ) {
        var self = this;

        button.disabled = true;
        button.textContent = "Loading versions...";

        Api.get("/documents/" + documentId + "/versions")
            .then(function (versions) {
                var area = self.parent.querySelector(
                    "#versions-" + documentId
                );

                area.innerHTML = "";

                versions = versions || [];

                versions.sort(function (a, b) {
                    return b.versionNumber - a.versionNumber;
                });

                if (versions.length === 0) {
                    area.textContent = "No versions available.";
                    return;
                }

                versions.forEach(function (version) {
                    var row = document.createElement("div");
                    row.className = "admin-document-version";

                    var details = document.createElement("span");

                    details.textContent =
                        "Version " + version.versionNumber +
                        " - " +
                        (version.originalFileName || "PDF file");

                    var viewButton = document.createElement("button");

                    viewButton.type = "button";
                    viewButton.textContent = "View PDF";
                    viewButton.dataset.action = "view";
                    viewButton.dataset.documentId = documentId;
                    viewButton.dataset.version = version.versionNumber;

                    row.appendChild(details);
                    row.appendChild(viewButton);

                    area.appendChild(row);
                });
            })
            .catch(function (error) {
                console.error("Version loading error:", error);

                self.message.textContent =
                    "Unable to load versions: " + error.message;
            })
            .finally(function () {
                button.disabled = false;
                button.textContent = "View Version History";
            });
    };

    AdminDocumentViewer.prototype.viewPdf = function (
        documentId,
        versionNumber
    ) {
        var self = this;

        // Open a blank tab immediately to avoid popup blocking.
        var pdfWindow = window.open("about:blank", "_blank");

        if (!pdfWindow) {
            this.message.textContent =
                "Please allow pop-ups to view PDF files.";
            return;
        }

        this.message.textContent = "Opening PDF...";

        var token = localStorage.getItem("jwtToken");

        var url =
            config.API_BASE_URL +
            "/documents/" + documentId +
            "/versions/" + versionNumber +
            "/download";

        fetch(url, {
            method: "GET",
            headers: token
                ? { Authorization: "Bearer " + token }
                : {}
        })
        .then(function (response) {
            if (!response.ok) {
                throw new Error("PDF download failed: " + response.status);
            }

            return response.blob();
        })
        .then(function (blob) {
            var pdfBlob = new Blob([blob], {
                type: "application/pdf"
            });

            var pdfUrl = URL.createObjectURL(pdfBlob);

            pdfWindow.location.href = pdfUrl;

            self.message.textContent =
                "PDF opened successfully. Version " + versionNumber;

            // Keep the URL available while the PDF tab is open.
            pdfWindow.addEventListener("beforeunload", function () {
                URL.revokeObjectURL(pdfUrl);
            });
        })
        .catch(function (error) {
            console.error("PDF viewing error:", error);

            pdfWindow.close();

            self.message.textContent =
                "Unable to open PDF: " + error.message;
        });
    };

    return AdminDocumentViewer;
});

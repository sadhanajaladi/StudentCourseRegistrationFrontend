define([
    "dojo/dom-construct",
    "dojo/on",
    "dojo/store/Memory",
    "dojo/data/ObjectStore",
    "dojox/grid/DataGrid",
    "dijit/form/TextBox",
    "dijit/form/ValidationTextBox",
    "dijit/form/NumberTextBox",
    "dijit/form/Form",
    "dijit/form/Button",
    "dijit/Dialog",
    "app/widgets/ConfirmDialog",
    "app/widgets/AdminDocumentViewer",
    "app/services/Api",
    "app/services/Logger",
    "app/services/Properties"
], function (domConstruct, on, Memory, ObjectStore, DataGrid, TextBox, ValidationTextBox, NumberTextBox, Form, Button, Dialog, ConfirmDialog, AdminDocumentViewer, api, Logger, Properties) {

    function AdminController(app) {
        this.app = app;
        this.activeGrid = null;
        this.docViewer = new AdminDocumentViewer();
    }

    // Load Students Tab with DataGrid & ConfirmDialog
    AdminController.prototype.loadStudents = function (host) {
        var self = this;
        host.innerHTML = [
            '<div class="card shadow-sm border-0 mb-4">',
            '<div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">',
            '<h5 class="card-title fw-bold text-primary mb-0">Registered Students</h5>',
            '<div style="max-width: 320px; width: 100%;" id="studentSearchSlot"></div>',
            '</div>',
            '<div class="card-body">',
            '<div id="adminStudentsGridContainer" style="height: 360px; width: 100%;"></div>',
            '</div></div>',
            '<div id="studentDetailModalSlot"></div>'
        ].join("");

        var searchBox = new TextBox({
            placeHolder: "Search by student name or email...",
            intermediateChanges: true,
            style: "width: 100%;"
        }, domConstruct.create("input", {}, host.querySelector("#studentSearchSlot")));
        searchBox.startup();

        Logger.info("AdminController", "Loading student records");
        api.get("/admin/students").then(function (students) {
            students = students || [];
            Logger.info("AdminController", "Retrieved " + students.length + " students");

            function renderGrid(dataList) {
                var gridSlot = host.querySelector("#adminStudentsGridContainer");
                gridSlot.innerHTML = "";
                if (!dataList.length) {
                    gridSlot.innerHTML = '<div class="alert alert-light border py-3 text-center">No students found.</div>';
                    return;
                }
                var formatted = dataList.map(function (s) {
                    return {
                        id: s.id,
                        name: s.name,
                        email: s.email,
                        createdAt: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"
                    };
                });
                var store = new Memory({ data: formatted, idProperty: "id" });
                var grid = new DataGrid({
                    store: new ObjectStore({ objectStore: store }),
                    structure: [[
                        { name: "Student ID", field: "id", width: "12%" },
                        { name: "Full Name", field: "name", width: "28%" },
                        { name: "Email Address", field: "email", width: "35%" },
                        { name: "Registered Date", field: "createdAt", width: "25%" }
                    ]],
                    autoHeight: true,
                    selectionMode: "single"
                }, domConstruct.create("div", { style: "height: 340px; width: 100%;" }, gridSlot));

                grid.startup();
                self.activeGrid = grid;

                on(grid, "RowClick", function (evt) {
                    var item = grid.getItem(evt.rowIndex);
                    if (!item) return;
                    var studentId = grid.store.getValue(item, "id");
                    var student = students.find(function (s) { return String(s.id) === String(studentId); });
                    if (student) self.showStudentModal(host, student, function () {
                        // Deleted
                        students = students.filter(function (s) { return s.id !== student.id; });
                        renderGrid(students);
                    });
                });
            }

            renderGrid(students);

            on(searchBox, "change", function (term) {
                term = String(term || "").toLowerCase().trim();
                var filtered = students.filter(function (s) {
                    return (String(s.name || "") + " " + String(s.email || "")).toLowerCase().indexOf(term) >= 0;
                });
                renderGrid(filtered);
            });
        }).catch(function (err) {
            Logger.error("AdminController", "Failed to load students", err);
            host.innerHTML = '<div class="alert alert-danger">Error loading students: ' + (err.message || err) + '</div>';
        });
    };

    AdminController.prototype.showStudentModal = function (host, student, onDeleted) {
        var self = this;
        var modalSlot = host.querySelector("#studentDetailModalSlot");
        modalSlot.innerHTML = "";

        var contentNode = domConstruct.create("div", {
            className: "p-3",
            innerHTML: '<div class="card border-0">' +
                '<div class="card-body">' +
                '<h5 class="fw-bold text-primary mb-3"><i class="bi bi-person-badge me-2"></i>' + student.name + '</h5>' +
                '<p class="mb-2"><strong>ID:</strong> ' + student.id + '</p>' +
                '<p class="mb-2"><strong>Email:</strong> ' + student.email + '</p>' +
                '<p class="mb-3"><strong>Registered At:</strong> ' + (student.createdAt ? new Date(student.createdAt).toLocaleString() : "—") + '</p>' +
                '<div class="d-flex justify-content-end gap-2 mt-4" id="studentModalActions"></div>' +
                '</div></div>'
        });

        var dialog = new Dialog({
            title: "Student Details",
            content: contentNode,
            style: "width: 440px;",
            onHide: function () { setTimeout(function () { dialog.destroyRecursive(); }, 150); }
        });

        var actions = contentNode.querySelector("#studentModalActions");

        var closeBtn = new Button({
            label: "Close",
            class: "btn btn-secondary",
            onClick: function () { dialog.hide(); }
        }, domConstruct.create("button", {}, actions));
        closeBtn.startup();

        var deleteBtn = new Button({
            label: "Delete Student",
            class: "btn btn-danger",
            onClick: function () {
                dialog.hide();
                ConfirmDialog.show({
                    title: "Delete Student Account",
                    message: "Are you sure you want to delete student <strong>" + student.name + "</strong> (" + student.email + ")? This cannot be undone.",
                    confirmLabel: "Delete Account",
                    isDanger: true
                }).then(function (confirmed) {
                    if (!confirmed) return;
                    Logger.info("AdminController", "Deleting student ID: " + student.id);
                    api.delete("/admin/students/" + student.id).then(function () {
                        self.app.notify("Student " + student.name + " deleted successfully.", false);
                        if (onDeleted) onDeleted();
                    }).catch(function (err) {
                        Logger.error("AdminController", "Delete student error", err);
                        self.app.notify("Failed to delete student: " + (err.message || err), true);
                    });
                });
            }
        }, domConstruct.create("button", {}, actions));
        deleteBtn.startup();

        dialog.show();
    };

    // Load Enrollments Tab with DataGrid & ConfirmDialog
    AdminController.prototype.loadEnrollments = function (host) {
        var self = this;
        host.innerHTML = [
            '<div class="card shadow-sm border-0 mb-4">',
            '<div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">',
            '<h5 class="card-title fw-bold text-primary mb-0">All Course Enrollments</h5>',
            '<div style="max-width: 320px; width: 100%;" id="enrollmentSearchSlot"></div>',
            '</div>',
            '<div class="card-body">',
            '<div id="adminEnrollmentsGridContainer" style="height: 380px; width: 100%;"></div>',
            '</div></div>'
        ].join("");

        var searchBox = new TextBox({
            placeHolder: "Filter student, email, or course...",
            intermediateChanges: true,
            style: "width: 100%;"
        }, domConstruct.create("input", {}, host.querySelector("#enrollmentSearchSlot")));
        searchBox.startup();

        Logger.info("AdminController", "Loading enrollments");
        api.get("/admin/enrollments").then(function (items) {
            items = items || [];
            Logger.info("AdminController", "Loaded " + items.length + " enrollment records");

            function renderEnrollments(list) {
                var gridSlot = host.querySelector("#adminEnrollmentsGridContainer");
                gridSlot.innerHTML = "";
                if (!list.length) {
                    gridSlot.innerHTML = '<div class="alert alert-light border py-3 text-center">No enrollments found.</div>';
                    return;
                }

                var formatted = list.map(function (e) {
                    return {
                        id: e.id,
                        student: e.studentName,
                        email: e.studentEmail,
                        course: e.courseTitle,
                        code: e.courseCode,
                        status: e.status,
                        progress: (e.progressStatus || "NOT_STARTED").replace(/_/g, " "),
                        raw: e
                    };
                });

                var store = new Memory({ data: formatted, idProperty: "id" });
                var grid = new DataGrid({
                    store: new ObjectStore({ objectStore: store }),
                    structure: [[
                        { name: "ID", field: "id", width: "8%" },
                        { name: "Student", field: "student", width: "20%" },
                        { name: "Email", field: "email", width: "22%" },
                        { name: "Course", field: "course", width: "22%" },
                        { name: "Code", field: "code", width: "10%" },
                        { name: "Status", field: "status", width: "10%" },
                        { name: "Progress", field: "progress", width: "18%" }
                    ]],
                    autoHeight: true,
                    selectionMode: "single"
                }, domConstruct.create("div", { style: "height: 360px; width: 100%;" }, gridSlot));

                grid.startup();
                self.activeGrid = grid;

                on(grid, "RowClick", function (evt) {
                    var item = grid.getItem(evt.rowIndex);
                    if (!item) return;
                    var enrollId = grid.store.getValue(item, "id");
                    var rawEnroll = list.find(function (e) { return String(e.id) === String(enrollId); });
                    if (!rawEnroll) return;

                    ConfirmDialog.show({
                        title: "Delete Course Enrollment",
                        message: "Are you sure you want to delete enrollment for student <strong>" +
                            rawEnroll.studentName + "</strong> in <strong>" + rawEnroll.courseTitle + "</strong>?",
                        confirmLabel: "Delete Enrollment",
                        isDanger: true
                    }).then(function (confirmed) {
                        if (!confirmed) return;
                        Logger.info("AdminController", "Deleting enrollment ID: " + rawEnroll.id);
                        api.delete("/admin/enrollments/" + rawEnroll.id).then(function () {
                            self.app.notify("Enrollment deleted successfully.", false);
                            items = items.filter(function (e) { return e.id !== rawEnroll.id; });
                            renderEnrollments(items);
                        }).catch(function (err) {
                            Logger.error("AdminController", "Delete enrollment error", err);
                            self.app.notify("Failed to delete enrollment: " + (err.message || err), true);
                        });
                    });
                });
            }

            renderEnrollments(items);

            on(searchBox, "change", function (term) {
                term = String(term || "").toLowerCase().trim();
                var filtered = items.filter(function (e) {
                    return [e.studentName, e.studentEmail, e.courseTitle, e.courseCode, e.status, e.progressStatus]
                        .join(" ").toLowerCase().indexOf(term) >= 0;
                });
                renderEnrollments(filtered);
            });
        }).catch(function (err) {
            Logger.error("AdminController", "Failed to load enrollments", err);
            host.innerHTML = '<div class="alert alert-danger">Error loading enrollments: ' + (err.message || err) + '</div>';
        });
    };

    // Load Courses Tab with ValidationForm + DataGrid
    AdminController.prototype.loadCourses = function (host) {
        var self = this;
        host.innerHTML = [
            '<div class="row g-4">',
            '<div class="col-lg-4">',
            '<div class="card shadow-sm border-0">',
            '<div class="card-header bg-white py-3 border-bottom">',
            '<h5 class="card-title fw-bold text-primary mb-0">Add New Course</h5>',
            '</div>',
            '<div class="card-body">',
            '<div id="adminCourseFormSlot"></div>',
            '</div></div></div>',
            '<div class="col-lg-8">',
            '<div class="card shadow-sm border-0">',
            '<div class="card-header bg-white py-3 border-bottom">',
            '<h5 class="card-title fw-bold text-primary mb-0">Available Courses</h5>',
            '</div>',
            '<div class="card-body">',
            '<div id="adminCourseGridSlot" style="height: 380px; width: 100%;"></div>',
            '</div></div></div></div>'
        ].join("");

        // Create Course Form using Dijit Form & ValidationTextBox
        var formHost = host.querySelector("#adminCourseFormSlot");
        var form = new Form({}, domConstruct.create("div", {}, formHost));

        var titleGroup = domConstruct.create("div", { className: "mb-3" }, form.domNode);
        domConstruct.create("label", { className: "form-label fw-semibold text-secondary", innerHTML: Properties.get("label.courseTitle", "Course Title") }, titleGroup);
        var titleInput = new ValidationTextBox({
            name: "title",
            required: true,
            trim: true,
            regExp: Properties.get("regex.courseTitle"),
            invalidMessage: Properties.get("val.courseTitle.invalid"),
            placeHolder: "e.g. Advanced Java & Spring Boot",
            style: "width: 100%;"
        }, domConstruct.create("input", {}, titleGroup));
        titleInput.startup();

        var codeGroup = domConstruct.create("div", { className: "mb-3" }, form.domNode);
        domConstruct.create("label", { className: "form-label fw-semibold text-secondary", innerHTML: Properties.get("label.courseCode", "Course Code") }, codeGroup);
        var codeInput = new ValidationTextBox({
            name: "courseCode",
            required: true,
            trim: true,
            regExp: Properties.get("regex.courseCode"),
            invalidMessage: Properties.get("val.courseCode.invalid"),
            placeHolder: "e.g. CS101",
            style: "width: 100%;"
        }, domConstruct.create("input", {}, codeGroup));
        codeInput.startup();

        var creditsGroup = domConstruct.create("div", { className: "mb-3" }, form.domNode);
        domConstruct.create("label", { className: "form-label fw-semibold text-secondary", innerHTML: Properties.get("label.credits", "Credits") }, creditsGroup);
        var creditsInput = new NumberTextBox({
            name: "credits",
            required: true,
            value: 3,
            constraints: { min: 1, max: 20, places: 0 },
            invalidMessage: Properties.get("val.credits.invalid"),
            style: "width: 100%;"
        }, domConstruct.create("input", {}, creditsGroup));
        creditsInput.startup();

        var descGroup = domConstruct.create("div", { className: "mb-4" }, form.domNode);
        domConstruct.create("label", { className: "form-label fw-semibold text-secondary", innerHTML: Properties.get("label.description", "Description") }, descGroup);
        var descInput = new TextBox({
            name: "description",
            placeHolder: "Enter course syllabus and description...",
            style: "width: 100%;"
        }, domConstruct.create("input", {}, descGroup));
        descInput.startup();

        var submitBtn = new Button({
            label: Properties.get("btn.addCourse", "Add Course"),
            class: "btn btn-primary w-100 fw-bold",
            onClick: function () {
                if (!form.validate()) {
                    Logger.warn("AdminController", "Course form validation failed");
                    return;
                }
                var payload = {
                    title: titleInput.get("value"),
                    courseCode: codeInput.get("value"),
                    credits: creditsInput.get("value"),
                    description: descInput.get("value")
                };
                Logger.info("AdminController", "Creating course: " + payload.courseCode);
                submitBtn.set("disabled", true);
                api.post("/courses", payload).then(function (res) {
                    self.app.notify("Course '" + res.title + "' added successfully!", false);
                    form.reset();
                    self.refreshCourseGrid(host);
                }).catch(function (err) {
                    Logger.error("AdminController", "Course creation error", err);
                    self.app.notify("Failed to create course: " + (err.message || err), true);
                }).finally(function () {
                    submitBtn.set("disabled", false);
                });
            }
        }, domConstruct.create("button", {}, form.domNode));
        submitBtn.startup();

        form.startup();
        this.refreshCourseGrid(host);
    };

    AdminController.prototype.refreshCourseGrid = function (host) {
        var self = this;
        var gridSlot = host.querySelector("#adminCourseGridSlot");
        gridSlot.innerHTML = '<div class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm me-2"></div> Loading courses...</div>';

        api.get("/courses").then(function (courses) {
            courses = courses || [];
            gridSlot.innerHTML = "";
            if (!courses.length) {
                gridSlot.innerHTML = '<div class="alert alert-light border py-3 text-center">No courses created yet.</div>';
                return;
            }

            var store = new Memory({ data: courses, idProperty: "id" });
            var grid = new DataGrid({
                store: new ObjectStore({ objectStore: store }),
                structure: [[
                    { name: "Code", field: "courseCode", width: "15%" },
                    { name: "Title", field: "title", width: "35%" },
                    { name: "Credits", field: "credits", width: "12%" },
                    { name: "Description", field: "description", width: "38%" }
                ]],
                autoHeight: true
            }, domConstruct.create("div", { style: "height: 360px; width: 100%;" }, gridSlot));

            grid.startup();
            self.activeGrid = grid;
        }).catch(function (err) {
            Logger.error("AdminController", "Failed to load course list", err);
            gridSlot.innerHTML = '<div class="alert alert-danger">Error loading courses: ' + (err.message || err) + '</div>';
        });
    };

    // Load Documents Tab (Delegates to AdminDocumentViewer)
    AdminController.prototype.loadDocuments = function (host) {
        Logger.info("AdminController", "Rendering AdminDocumentViewer");
        this.docViewer.placeAt(host);
    };

    return AdminController;
});

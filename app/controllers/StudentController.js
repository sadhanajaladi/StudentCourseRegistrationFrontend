define([
    "dojo/dom-construct",
    "dojo/on",
    "dojo/store/Memory",
    "dojo/data/ObjectStore",
    "dojox/grid/EnhancedGrid",
    "dijit/form/TextBox",
    "dijit/form/Select",
    "dijit/form/Button",
    "dijit/Dialog",
    "app/widgets/DocumentManagement",
    "app/services/Api",
    "app/services/Logger",
    "app/services/Properties"
], function (domConstruct, on, Memory, ObjectStore, EnhancedGrid, TextBox, Select, Button, Dialog, DocumentManagement, api, Logger, Properties) {

    function StudentController(app) {
        this.app = app;
        this.courses = [];
        this.enrollments = [];
        this.docManagement = new DocumentManagement();
    }

    // Available Courses Tab with EnhancedGrid
    StudentController.prototype.loadAvailableCourses = function (host) {
        var self = this;
        host.innerHTML = [
            '<div class="card shadow-sm border-0 mb-4">',
            '<div class="card-header bg-white py-3 border-bottom"><h5 class="card-title fw-bold text-primary mb-0">📚 Explore & Enroll in Courses</h5></div>',
            '<div class="card-body">',
            '<div class="dashboard-search-panel mb-3">',
            '<label class="form-label fw-semibold text-secondary mb-2" for="studentCourseSearchInput"><span aria-hidden="true">🔍</span> Search courses</label>',
            '<div id="studentCourseSearchSlot"></div>',
            '</div>',
            '<div id="studentCourseGridContainer" style="height: 380px; width: 100%;"></div>',
            '</div></div>'
        ].join("");

        var searchBox = new TextBox({
            placeHolder: "Search courses by code or title...",
            intermediateChanges: true,
            style: "width: 100%;"
        }, domConstruct.create("input", { id: "studentCourseSearchInput", "aria-label": "Search courses by code, title, or description" }, host.querySelector("#studentCourseSearchSlot")));
        searchBox.startup();

        Logger.info("StudentController", "Loading courses and student enrollments");
        Promise.all([api.get("/courses"), api.get("/student/enrollments")]).then(function (results) {
            self.courses = results[0] || [];
            self.enrollments = results[1] || [];

            function renderCourses(list) {
                var gridSlot = host.querySelector("#studentCourseGridContainer");
                gridSlot.innerHTML = "";
                if (!list.length) {
                    gridSlot.innerHTML = '<div class="alert alert-light border py-3 text-center">No courses found matching your criteria.</div>';
                    return;
                }

                var formatted = list.map(function (c) {
                    var isEnrolled = self.enrollments.some(function (e) {
                        return e.courseId === c.id && e.status === "ENROLLED";
                    });
                    return {
                        id: c.id,
                        courseCode: c.courseCode,
                        title: c.title,
                        credits: c.credits + " Credits",
                        description: c.description || "No description provided.",
                        status: isEnrolled ? "Enrolled" : "Not Enrolled",
                        isEnrolled: isEnrolled,
                        raw: c
                    };
                });

                var store = new Memory({ data: formatted, idProperty: "id" });
                var grid = new EnhancedGrid({
                    store: new ObjectStore({ objectStore: store }),
                    structure: [[
                        { name: "Course Code", field: "courseCode", width: "15%" },
                        { name: "Title", field: "title", width: "30%" },
                        { name: "Credits", field: "credits", width: "12%" },
                        { name: "Description", field: "description", width: "28%" },
                        { name: "Enrollment Status", field: "status", width: "15%" }
                    ]],
                    autoHeight: true,
                    selectionMode: "single"
                }, domConstruct.create("div", { style: "height: 360px; width: 100%;" }, gridSlot));

                grid.startup();

                on(grid, "RowClick", function (evt) {
                    var item = grid.getItem(evt.rowIndex);
                    if (!item) return;
                    var courseId = grid.store.getValue(item, "id");
                    var isEnrolled = grid.store.getValue(item, "isEnrolled");
                    var course = self.courses.find(function (c) { return String(c.id) === String(courseId); });
                    if (course) self.showCourseDetails(host, course, isEnrolled);
                });
            }

            renderCourses(self.courses);

            on(searchBox, "change", function (term) {
                term = String(term || "").toLowerCase().trim();
                var filtered = self.courses.filter(function (c) {
                    return [c.title, c.courseCode, c.description].join(" ").toLowerCase().indexOf(term) >= 0;
                });
                renderCourses(filtered);
            });
        }).catch(function (err) {
            Logger.error("StudentController", "Failed to load courses", err);
            host.innerHTML = '<div class="alert alert-danger">Error loading courses: ' + (err.message || err) + '</div>';
        });
    };

    StudentController.prototype.showCourseDetails = function (host, course, isEnrolled) {
        var self = this;
        var content = domConstruct.create("div", {
            className: "p-3",
            innerHTML: '<div class="card border-0">' +
                '<div class="card-body">' +
                '<h5 class="fw-bold text-primary mb-2">[' + course.courseCode + '] ' + course.title + '</h5>' +
                '<p class="text-muted mb-3">' + (course.description || "No description available.") + '</p>' +
                '<p class="mb-2"><strong>Credits:</strong> ' + course.credits + '</p>' +
                '<p class="mb-4"><strong>Current Status:</strong> ' +
                (isEnrolled ? '<span class="badge bg-success ms-1">Enrolled</span>' : '<span class="badge bg-secondary ms-1">Not Enrolled</span>') + '</p>' +
                '<div class="d-flex justify-content-end gap-2" id="courseDetailActions"></div>' +
                '</div></div>'
        });

        var dialog = new Dialog({
            title: "Course Details",
            content: content,
            style: "width: 460px;",
            onHide: function () { setTimeout(function () { dialog.destroyRecursive(); }, 150); }
        });

        var actions = content.querySelector("#courseDetailActions");

        var closeBtn = new Button({
            label: "Close",
            class: "btn btn-secondary",
            onClick: function () { dialog.hide(); }
        }, domConstruct.create("button", {}, actions));
        closeBtn.startup();

        if (!isEnrolled) {
            var enrollBtn = new Button({
                label: Properties.get("btn.enroll", "Enroll Now"),
                class: "btn btn-primary fw-bold",
                onClick: function () {
                    dialog.hide();
                    Logger.info("StudentController", "Enrolling in course ID: " + course.id);
                    api.post("/student/enrollments", { courseId: course.id }).then(function () {
                        self.app.notify("Successfully enrolled in " + course.title + "!", false);
                        self.loadAvailableCourses(host);
                    }).catch(function (err) {
                        Logger.error("StudentController", "Enrollment failed", err);
                        self.app.notify("Enrollment failed: " + (err.message || err), true);
                    });
                }
            }, domConstruct.create("button", {}, actions));
            enrollBtn.startup();
        }

        dialog.show();
    };

    // My Enrollments Tab with EnhancedGrid & Progress Update
    StudentController.prototype.loadMyEnrollments = function (host) {
        var self = this;
        host.innerHTML = [
            '<div class="card shadow-sm border-0 mb-4">',
            '<div class="card-header bg-white py-3 border-bottom">',
            '<h5 class="card-title fw-bold text-primary mb-0">My Active Enrollments</h5>',
            '</div>',
            '<div class="card-body">',
            '<div id="myEnrollmentsGridContainer" style="height: 360px; width: 100%;"></div>',
            '</div></div>'
        ].join("");

        var gridSlot = host.querySelector("#myEnrollmentsGridContainer");
        Logger.info("StudentController", "Loading my enrollments");

        api.get("/student/enrollments").then(function (enrollments) {
            self.enrollments = (enrollments || []).filter(function (e) { return e.status === "ENROLLED"; });
            Logger.info("StudentController", "Student has " + self.enrollments.length + " active enrollments");

            if (!self.enrollments.length) {
                gridSlot.innerHTML = '<div class="alert alert-info border py-3 text-center">You have not enrolled in any courses yet. Check the Available Courses tab.</div>';
                return;
            }

            var formatted = self.enrollments.map(function (e) {
                return {
                    id: e.id,
                    code: e.courseCode,
                    title: e.courseTitle,
                    status: e.status,
                    progress: (e.progressStatus || "NOT_STARTED").replace(/_/g, " "),
                    raw: e
                };
            });

            var store = new Memory({ data: formatted, idProperty: "id" });
            var grid = new EnhancedGrid({
                store: new ObjectStore({ objectStore: store }),
                structure: [[
                    { name: "Course Code", field: "code", width: "18%" },
                    { name: "Course Title", field: "title", width: "40%" },
                    { name: "Status", field: "status", width: "17%" },
                    { name: "Course Progress", field: "progress", width: "25%" }
                ]],
                autoHeight: true,
                selectionMode: "single"
            }, domConstruct.create("div", { style: "height: 340px; width: 100%;" }, gridSlot));

            grid.startup();

            on(grid, "RowClick", function (evt) {
                var item = grid.getItem(evt.rowIndex);
                if (!item) return;
                var enrollId = grid.store.getValue(item, "id");
                var enroll = self.enrollments.find(function (e) { return String(e.id) === String(enrollId); });
                if (enroll) self.showProgressDialog(host, enroll);
            });
        }).catch(function (err) {
            Logger.error("StudentController", "Error loading student enrollments", err);
            gridSlot.innerHTML = '<div class="alert alert-danger">Error loading enrollments: ' + (err.message || err) + '</div>';
        });
    };

    StudentController.prototype.showProgressDialog = function (host, enrollment) {
        var self = this;
        var content = domConstruct.create("div", {
            className: "p-3",
            innerHTML: '<div class="card border-0">' +
                '<div class="card-body">' +
                '<h5 class="fw-bold text-primary mb-2">' + enrollment.courseTitle + ' (' + enrollment.courseCode + ')</h5>' +
                '<p class="text-muted mb-3">Update your learning progress for this course:</p>' +
                '<div class="mb-4" id="progressSelectSlot"></div>' +
                '<div class="d-flex justify-content-end gap-2" id="progressDialogActions"></div>' +
                '</div></div>'
        });

        var select = new Select({
            name: "progressStatus",
            options: [
                { label: "Not Started", value: "NOT_STARTED", selected: (enrollment.progressStatus || "NOT_STARTED") === "NOT_STARTED" },
                { label: "In Progress", value: "IN_PROGRESS", selected: enrollment.progressStatus === "IN_PROGRESS" },
                { label: "Completed", value: "COMPLETED", selected: enrollment.progressStatus === "COMPLETED" }
            ],
            style: "width: 100%;"
        }, domConstruct.create("div", {}, content.querySelector("#progressSelectSlot")));
        select.startup();

        var dialog = new Dialog({
            title: "Update Course Progress",
            content: content,
            style: "width: 440px;",
            onHide: function () { setTimeout(function () { dialog.destroyRecursive(); }, 150); }
        });

        var actions = content.querySelector("#progressDialogActions");

        var cancelBtn = new Button({
            label: "Cancel",
            class: "btn btn-secondary",
            onClick: function () { dialog.hide(); }
        }, domConstruct.create("button", {}, actions));
        cancelBtn.startup();

        var saveBtn = new Button({
            label: "Save Progress",
            class: "btn btn-primary fw-bold",
            onClick: function () {
                var newStatus = select.get("value");
                dialog.hide();
                Logger.info("StudentController", "Updating enrollment " + enrollment.id + " progress to " + newStatus);
                api.put("/student/enrollments/" + enrollment.id + "/progress", { progressStatus: newStatus })
                    .then(function () {
                        self.app.notify("Course progress updated successfully!", false);
                        self.loadMyEnrollments(host);
                    })
                    .catch(function (err) {
                        Logger.error("StudentController", "Failed to update progress", err);
                        self.app.notify("Could not update progress: " + (err.message || err), true);
                    });
            }
        }, domConstruct.create("button", {}, actions));
        saveBtn.startup();

        dialog.show();
    };

    // My Documents Tab (Delegates to DocumentManagement)
    StudentController.prototype.loadDocuments = function (host) {
        Logger.info("StudentController", "Rendering DocumentManagement");
        this.docManagement.render(host);
    };

    return StudentController;
});

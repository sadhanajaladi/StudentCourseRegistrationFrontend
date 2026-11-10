
define([
    "dojo/dom",
    "dojo/on",
    "app/services/Api"
], function (dom, on, api) {

    function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
        });
    }

    function date(v) {
        return v ? new Date(v).toLocaleString() : "—";
    }

    function AdminController(app) {
        this.app = app;
    }

    AdminController.prototype.show = function (tab) {
        var methods = {
            students: "students",
            enrollments: "enrollments",
            courses: "courses"
        };

        if (methods[tab]) this[methods[tab]]();
    };

    AdminController.prototype.students = function () {
        var self = this, app = this.app;
        var host = dom.byId("adminContent");

        host.innerHTML = '<section class="panel"><h2>Registered Students</h2>Loading...</section>';

        api.get("/admin/students").then(function (students) {
            var page = 1, size = 5;

            function draw() {
                var pages = Math.max(1, Math.ceil(students.length / size));
                var current = students.slice((page - 1) * size, page * size);

                host.innerHTML = '<section class="panel"><h2>Registered Students</h2>' +
                    (students.length
                        ? '<div class="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Created At</th><th>Actions</th></tr></thead><tbody>' +
                        current.map(function (s) {
                            return '<tr><td>' + esc(s.id) + '</td><td>' + esc(s.name) +
                                '</td><td>' + esc(s.email) + '</td><td>' + esc(date(s.createdAt)) +
                                '</td><td><button class="secondary view-student" data-id="' + esc(s.id) +
                                '">View</button> <button class="danger delete-student" data-id="' +
                                esc(s.id) + '">Delete</button></td></tr>';
                        }).join("") +
                        '</tbody></table></div><div class="pager">Page ' + page + ' of ' + pages +
                        ' <button id="prevPage" class="secondary"' + (page === 1 ? " disabled" : "") +
                        '>Previous</button> <button id="nextPage" class="secondary"' +
                        (page === pages ? " disabled" : "") + '>Next</button></div>'
                        : '<p>No students found.</p>') +
                    '<div id="studentDetail"></div></section>';

                if (dom.byId("prevPage")) on(dom.byId("prevPage"), "click", function () {
                    page--; draw();
                });

                if (dom.byId("nextPage")) on(dom.byId("nextPage"), "click", function () {
                    page++; draw();
                });

                host.querySelectorAll(".view-student").forEach(function (b) {
                    on(b, "click", function () {
                        api.get("/admin/students/" + b.dataset.id).then(function (s) {
                            dom.byId("studentDetail").innerHTML =
                                '<div class="detail-box"><h3>Student Details</h3>' +
                                '<p><b>ID:</b> ' + esc(s.id) + '</p>' +
                                '<p><b>Name:</b> ' + esc(s.name) + '</p>' +
                                '<p><b>Email:</b> ' + esc(s.email) + '</p>' +
                                '<p><b>Created:</b> ' + esc(date(s.createdAt)) + '</p></div>';
                        }).catch(function (e) { app.notify(e.message, true); });
                    });
                });

                host.querySelectorAll(".delete-student").forEach(function (b) {
                    on(b, "click", function () {
                        var student = students.find(function (s) {
                            return String(s.id) === b.dataset.id;
                        });

                        if (!student || !confirm("Delete " + student.name + "?")) return;

                        api.delete("/admin/students/" + student.id).then(function () {
                            students = students.filter(function (s) {
                                return s.id !== student.id;
                            });
                            app.notify("Student deleted successfully.");
                            draw();
                        }).catch(function (e) { app.notify(e.message, true); });
                    });
                });
            }

            draw();
        }).catch(function (e) {
            host.innerHTML = '<p class="notice error">' + esc(e.message) + '</p>';
        });
    };

    AdminController.prototype.enrollments = function () {
        var self = this, app = this.app;
        var host = dom.byId("adminContent");

        api.get("/admin/enrollments").then(function (items) {
            function draw(term) {
                var filtered = items.filter(function (i) {
                    return [i.studentName, i.studentEmail, i.courseTitle, i.courseCode, i.status]
                        .join(" ").toLowerCase().includes((term || "").toLowerCase());
                });

                host.innerHTML = '<section class="panel"><h2>Student Enrollments</h2>' +
                    '<input id="enrollmentSearch" type="search" placeholder="Search enrollments..." value="' +
                    esc(term || "") + '">' +
                    '<div class="table-wrap"><table><thead><tr><th>ID</th><th>Student</th><th>Email</th><th>Course</th><th>Status</th><th>Action</th></tr></thead><tbody>' +
                    filtered.map(function (i) {
                        return '<tr><td>' + esc(i.id) + '</td><td>' + esc(i.studentName) +
                            '</td><td>' + esc(i.studentEmail) + '</td><td>' + esc(i.courseTitle) +
                            '</td><td>' + esc(i.status) +
                            '</td><td><button class="danger delete-enrollment" data-id="' +
                            esc(i.id) + '">Delete</button></td></tr>';
                    }).join("") +
                    '</tbody></table></div><p>' + filtered.length + ' result(s)</p></section>';

                on(dom.byId("enrollmentSearch"), "input", function (e) {
                    var pos = e.target.selectionStart;
                    draw(e.target.value);
                    var input = dom.byId("enrollmentSearch");
                    input.focus();
                    input.setSelectionRange(pos, pos);
                });

                host.querySelectorAll(".delete-enrollment").forEach(function (b) {
                    on(b, "click", function () {
                        var item = items.find(function (i) {
                            return String(i.id) === b.dataset.id;
                        });

                        if (!item || !confirm("Delete this enrollment?")) return;

                        api.delete("/admin/enrollments/" + item.id).then(function () {
                            items = items.filter(function (i) { return i.id !== item.id; });
                            app.notify("Enrollment deleted successfully.");
                            draw(dom.byId("enrollmentSearch").value);
                        }).catch(function (e) { app.notify(e.message, true); });
                    });
                });
            }

            draw("");
        }).catch(function (e) {
            host.innerHTML = '<p class="notice error">' + esc(e.message) + '</p>';
        });
    };

    AdminController.prototype.courses = function () {
        var app = this.app, host = dom.byId("adminContent");

        api.get("/courses").then(function (courses) {
            host.innerHTML = '<section class="panel"><h2>Add New Course</h2>' +
                '<form id="courseForm" class="form-grid">' +
                '<label>Course Title<input name="title" required></label>' +
                '<label>Course Code<input name="courseCode" required></label>' +
                '<label>Credits<input name="credits" type="number" min="1" value="3" required></label>' +
                '<label class="wide">Description<textarea name="description"></textarea></label>' +
                '<button class="primary" type="submit">Add Course</button></form></section>' +
                '<section class="panel"><h2>Available Courses (' + courses.length + ')</h2>' +
                '<div class="grid">' + courses.map(function (c) {
                    return '<article class="course-card"><span class="pill">' + esc(c.courseCode) +
                        '</span><h3>' + esc(c.title) + '</h3><p>' + esc(c.description || "") +
                        '</p><b>Credits:</b> ' + esc(c.credits) + '</article>';
                }).join("") + '</div></section>';

            on(dom.byId("courseForm"), "submit", function (e) {
                e.preventDefault();
                var f = e.target, credits = Number(f.credits.value);

                if (!Number.isInteger(credits) || credits < 1) {
                    return app.notify("Credits must be a positive whole number.", true);
                }

                api.post("/courses", {
                    title: f.title.value.trim(),
                    courseCode: f.courseCode.value.trim(),
                    credits: credits,
                    description: f.description.value.trim()
                }).then(function (c) {
                    app.notify('Course "' + c.title + '" created successfully.');
                    this.courses();
                }.bind(this)).catch(function (e) {
                    app.notify(e.message, true);
                });
            }.bind(this));
        }).catch(function (e) {
            host.innerHTML = '<p class="notice error">' + esc(e.message) + '</p>';
        });
    };

    return AdminController;
});

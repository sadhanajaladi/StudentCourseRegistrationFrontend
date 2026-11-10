
define([
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/on",
    "app/services/Api",
    "app/controllers/AuthController",
    "app/widgets/Login",
    "app/widgets/Signup",
    "app/widgets/Navbar",
    "app/widgets/StudentDashboard",
    "app/widgets/AdminDashboard",
    "app/widgets/CourseCard",
    "app/widgets/DocumentUpload",
    "app/widgets/DocumentManagement"
], function (
    dom, domConstruct, on, api, AuthController,
    LoginWidget, SignupWidget, NavbarWidget,
    StudentDashboardWidget, AdminDashboardWidget,
    CourseCardWidget, DocumentUploadWidget, DocumentManagementWidget
) {
    function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
        });
    }

    function date(v) {
        return v ? new Date(v).toLocaleString() : "—";
    }

    function App() {
        this.root = dom.byId("app");
        this.user = null;
        this.route = location.hash || "#/login";
        this.message = "";
        this.error = "";
        this.activeTab = "students";
        this.courseSearch = "";
    }

    App.prototype.start = function () {
        var self = this;

        on(window, "hashchange", function () {
            self.route = location.hash;
            self.render();
        });

        if (localStorage.getItem("jwtToken")) {
            AuthController.getCurrentUser()
                .then(function (user) {
                    self.user = user;
                    self.go(user.role === "ADMIN" ? "#/admin" : "#/student");
                })
                .catch(function () {
                    AuthController.clearSession();
                    self.go("#/login");
                });
        } else {
            this.go(this.route === "#/register" ? "#/register" : "#/login");
        }
    };

    App.prototype.go = function (route) {
        if (location.hash !== route) location.hash = route;
        this.route = route;
        this.render();
    };

    App.prototype.notify = function (message, isError) {
        this.message = isError ? "" : message;
        this.error = isError ? message : "";
        var area = dom.byId("notice");
        if (area) area.innerHTML = this.noticeHTML();
    };

    App.prototype.noticeHTML = function () {
        return (this.message ? '<div class="notice success">' + esc(this.message) + '</div>' : "") +
            (this.error ? '<div class="notice error">' + esc(this.error) + '</div>' : "");
    };

    App.prototype.render = function () {
        if (!this.root) return;
        if (!this.user && this.route !== "#/register") return this.renderLogin();
        if (!this.user && this.route === "#/register") return this.renderRegister();
        if (this.user.role === "ADMIN") return this.renderAdmin();
        this.renderStudent();
    };

    App.prototype.renderLogin = function () {
        var self = this;
        this.root.innerHTML = LoginWidget.render();

        on(dom.byId("loginForm"), "submit", function (event) {
            event.preventDefault();
            var form = event.target;
            var button = form.querySelector("button");
            button.disabled = true;
            button.textContent = "Signing in...";

            AuthController.login(form.email.value, form.password.value)
                .then(function (data) {
                    self.user = data;
                    self.go(data.role === "ADMIN" ? "#/admin" : "#/student");
                })
                .catch(function (err) {
                    dom.byId("authNotice").innerHTML =
                        '<div class="notice error">' + esc(err.message || "Login failed.") + '</div>';
                    button.disabled = false;
                    button.textContent = "Login";
                });
        });
    };

    App.prototype.renderRegister = function () {
        this.root.innerHTML = SignupWidget.render();

        on(dom.byId("registerForm"), "submit", function (event) {
            event.preventDefault();
            var form = event.target;
            var button = form.querySelector("button");

            if (form.password.value !== form.confirmPassword.value) {
                dom.byId("authNotice").innerHTML =
                    '<div class="notice error">Passwords do not match.</div>';
                return;
            }

            if (form.password.value.length < 8) {
                dom.byId("authNotice").innerHTML =
                    '<div class="notice error">Password must contain at least 8 characters.</div>';
                return;
            }

            button.disabled = true;

            AuthController.signup({
                name: form.name.value.trim(),
                email: form.email.value.trim(),
                password: form.password.value
            })
                .then(function () {
                    dom.byId("authNotice").innerHTML =
                        '<div class="notice success">Registration successful! You can now log in.</div>';
                    form.reset();
                    button.disabled = false;
                })
                .catch(function (err) {
                    dom.byId("authNotice").innerHTML =
                        '<div class="notice error">' + esc(err.message || "Registration failed.") + '</div>';
                    button.disabled = false;
                });
        });
    };

    App.prototype.header = function (title) {
        return NavbarWidget.render(title, this.user);
    };

    App.prototype.bindLogout = function () {
        var self = this;
        on(dom.byId("logout"), "click", function () {
            AuthController.logout().then(function () {
                AuthController.clearSession();
                self.user = null;
                self.go("#/login");
            });
        });
    };

    // STUDENT DASHBOARD

    App.prototype.renderStudent = function () {
        var self = this;
        var documentsLoaded = false;

        this.root.innerHTML = StudentDashboardWidget.render(
            this.header("Student Dashboard"), this.user, this.noticeHTML()
        );

        this.bindLogout();

        this.root.querySelectorAll("[data-student-tab]").forEach(function (button) {
            on(button, "click", function () {
                var tab = button.getAttribute("data-student-tab");

                self.root.querySelectorAll("[data-student-tab]").forEach(function (b) {
                    b.classList.toggle("active", b === button);
                });

                ["courses", "enrollments", "documents"].forEach(function (name) {
                    dom.byId("student" + name.charAt(0).toUpperCase() + name.slice(1)).style.display =
                        tab === name ? "" : "none";
                });

                if (tab === "documents" && !documentsLoaded) {
                    documentsLoaded = true;
                    new DocumentManagementWidget().render(dom.byId("studentDocumentContent"));
                }
            });
        });

        Promise.all([api.get("/courses"), api.get("/student/enrollments")])
            .then(function (results) {
                self.courses = results[0] || [];
                self.enrollments = results[1] || [];
                self.renderCourseList();
                self.renderMyEnrollments();

                on(dom.byId("courseSearch"), "input", function (e) {
                    self.courseSearch = e.target.value;
                    self.renderCourseList();
                });
            })
            .catch(function (err) {
                self.notify(err.message || "Could not load dashboard.", true);
            });
    };

    App.prototype.renderCourseList = function () {
        var self = this;
        var term = (this.courseSearch || "").toLowerCase().trim();

        var courses = (this.courses || []).filter(function (c) {
            return [c.title, c.courseCode, c.description].some(function (v) {
                return String(v || "").toLowerCase().indexOf(term) >= 0;
            });
        });

        var html = courses.map(function (c) {
            var enrolled = (self.enrollments || []).some(function (e) {
                return e.courseId === c.id && e.status === "ENROLLED";
            });
            return CourseCardWidget.render(c, enrolled);
        }).join("");

        dom.byId("courseList").innerHTML = courses.length
            ? '<div class="grid">' + html + '</div>'
            : '<p>No matching courses found.</p>';

        dom.byId("courseList").querySelectorAll(".enroll-course").forEach(function (button) {
            on(button, "click", function () {
                self.enroll(button.getAttribute("data-id"));
            });
        });

        dom.byId("courseList").querySelectorAll(".details-course").forEach(function (button) {
            on(button, "click", function () {
                self.showCourse(button.getAttribute("data-id"));
            });
        });
    };

    // STUDENT ENROLLMENTS WITH PROGRESS DROPDOWN

App.prototype.renderMyEnrollments = function () {
    var self = this;
    var items = (this.enrollments || []).filter(function (e) {
        return e.status === "ENROLLED";
    });

    var host = dom.byId("myEnrollments");

    host.innerHTML = items.length
        ? '<div class="enrollment-table">' +
          '<div class="enrollment-header">' +
          '<span>Course Name</span>' +
          '<span>Course Code</span>' +
          '<span>Enrollment Status</span>' +
          '<span>Course Progress</span>' +
          '</div>' +
          items.map(function (e) {
              var progress = e.progressStatus || "NOT_STARTED";

              return '<div class="enrollment-row">' +
                  '<strong>' + esc(e.courseTitle) + '</strong>' +
                  '<span>' + esc(e.courseCode) + '</span>' +
                  '<span><span class="pill">' + esc(e.status) + '</span></span>' +
                  '<div class="progress-area">' +
                  '<span class="pill progress-badge">' +
                  esc(progress.replace(/_/g, " ")) + '</span>' +
                  '<button class="secondary edit-progress" data-id="' +
                  esc(e.id) + '">Change</button>' +
                  '</div></div>';
          }).join("") +
          '</div>'
        : "<p>You have not enrolled in any courses yet.</p>";

    host.querySelectorAll(".edit-progress").forEach(function (button) {
        on(button, "click", function () {
            var id = button.getAttribute("data-id");
            var enrollment = self.enrollments.filter(function (e) {
                return String(e.id) === id;
            })[0];

            var area = button.parentNode;
            var badge = area.querySelector(".progress-badge");
            var select = document.createElement("select");

            select.className = "progress-select";

            [
                ["NOT_STARTED", "Not Started"],
                ["IN_PROGRESS", "In Progress"],
                ["COMPLETED", "Completed"]
            ].forEach(function (option) {
                var item = document.createElement("option");
                item.value = option[0];
                item.textContent = option[1];
                select.appendChild(item);
            });

            select.value = enrollment.progressStatus || "NOT_STARTED";
            button.style.display = "none";
            badge.style.display = "none";
            area.appendChild(select);

            on(select, "change", function () {
                select.disabled = true;

                api.put("/student/enrollments/" + id + "/progress", {
                    progressStatus: select.value
                }).then(function (updated) {
                    self.enrollments = self.enrollments.map(function (e) {
                        return String(e.id) === id ? updated : e;
                    });

                    self.renderMyEnrollments();
                    self.notify("Course progress updated successfully.");
                }).catch(function (err) {
                    self.notify(err.message || "Unable to update progress.", true);
                    self.renderMyEnrollments();
                });
            });
        });
    });
};

    App.prototype.enroll = function (courseId) {
        var self = this;

        api.post("/student/enrollments", {courseId: Number(courseId)})
            .then(function () {
                self.notify("Successfully enrolled in the course!");
                return Promise.all([api.get("/courses"), api.get("/student/enrollments")]);
            })
            .then(function (results) {
                self.courses = results[0] || [];
                self.enrollments = results[1] || [];
                self.renderCourseList();
                self.renderMyEnrollments();
            })
            .catch(function (err) {
                self.notify(err.message || "Enrollment failed.", true);
            });
    };

    App.prototype.showCourse = function (id) {
        var self = this;

        api.get("/courses/" + encodeURIComponent(id))
            .then(function (course) {
                var existing = (self.enrollments || []).some(function (e) {
                    return e.courseId === course.id && e.status === "ENROLLED";
                });

                var panel = domConstruct.toDom(
                    '<section class="panel">' +
                    '<button id="closeCourse" class="secondary">Back to Dashboard</button>' +
                    '<h2>' + esc(course.title) + '</h2>' +
                    '<p><b>Course ID:</b> ' + esc(course.id) + '</p>' +
                    '<p><b>Course Code:</b> ' + esc(course.courseCode) + '</p>' +
                    '<p>' + esc(course.description) + '</p>' +
                    '<p><b>Credits:</b> ' + esc(course.credits) + '</p>' +
                    '<p><b>Enrollment Status:</b> ' + (existing ? "Enrolled" : "Not enrolled") + '</p>' +
                    '<button id="detailEnroll" class="primary"' + (existing ? " disabled" : "") + '>' +
                    (existing ? "Already Enrolled" : "Enroll Now") +
                    '</button></section>'
                );

                self.root.querySelector(".page").innerHTML =
                    self.header("Course Details") + '<div id="notice"></div>';
                self.root.querySelector(".page").appendChild(panel);
                self.bindLogout();

                on(dom.byId("closeCourse"), "click", function () {
                    self.renderStudent();
                });

                on(dom.byId("detailEnroll"), "click", function () {
                    self.enroll(course.id);
                    self.renderStudent();
                });
            })
            .catch(function (err) {
                self.notify(err.message || "Unable to load course details.", true);
            });
    };

    // ADMIN DASHBOARD

    App.prototype.renderAdmin = function () {
        var self = this;

        this.root.innerHTML = AdminDashboardWidget.render(
            this.header("Admin Dashboard"), this.noticeHTML()
        );
        this.bindLogout();

        this.root.querySelectorAll("[data-tab]").forEach(function (button) {
            on(button, "click", function () {
                self.activeTab = button.getAttribute("data-tab");
                self.root.querySelectorAll("[data-tab]").forEach(function (b) {
                    b.classList.toggle("active", b === button);
                });
                self.renderAdminTab();
            });
        });

        this.renderAdminTab();
    };

    App.prototype.renderAdminTab = function () {
        if (this.activeTab === "students") this.loadStudents();
        if (this.activeTab === "enrollments") this.loadEnrollments();
        if (this.activeTab === "courses") this.loadAdminCourses();
        if (this.activeTab === "documents") this.loadDocuments();
    };

    // ADMIN STUDENT MANAGEMENT

    App.prototype.loadStudents = function () {
        var self = this;
        var host = dom.byId("adminContent");

        host.innerHTML = '<section class="panel"><h2>Registered Students</h2><p>Loading students...</p></section>';

        api.get("/admin/students")
            .then(function (students) {
                var page = 1, perPage = 5;

                function draw() {
                    var pages = Math.max(1, Math.ceil(students.length / perPage));
                    var current = students.slice((page - 1) * perPage, page * perPage);

                    host.innerHTML = '<section class="panel"><h2>Registered Students</h2>' +
                        (students.length
                            ? '<div class="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Created At</th><th>Actions</th></tr></thead><tbody>' +
                            current.map(function (s) {
                                return '<tr><td>' + esc(s.id) + '</td><td>' + esc(s.name) +
                                    '</td><td>' + esc(s.email) + '</td><td>' + esc(date(s.createdAt)) +
                                    '</td><td><button class="secondary view-student" data-id="' + esc(s.id) +
                                    '">View Details</button> <button class="danger delete-student" data-id="' +
                                    esc(s.id) + '">Delete</button></td></tr>';
                            }).join("") +
                            '</tbody></table></div><div class="pager"><span>Showing ' +
                            ((page - 1) * perPage + 1) + '–' + Math.min(page * perPage, students.length) +
                            ' of ' + students.length + '</span><div><button id="prevPage" class="secondary"' +
                            (page === 1 ? " disabled" : "") + '>Previous</button> Page ' + page +
                            ' of ' + pages + ' <button id="nextPage" class="secondary"' +
                            (page === pages ? " disabled" : "") + '>Next</button></div></div>'
                            : '<p>No students found.</p>') +
                        '<div id="studentDetail"></div></section>';

                    if (dom.byId("prevPage")) on(dom.byId("prevPage"), "click", function () {
                        page--;
                        draw();
                    });

                    if (dom.byId("nextPage")) on(dom.byId("nextPage"), "click", function () {
                        page++;
                        draw();
                    });

                    host.querySelectorAll(".view-student").forEach(function (button) {
                        on(button, "click", function () {
                            api.get("/admin/students/" + button.getAttribute("data-id"))
                                .then(function (s) {
                                    dom.byId("studentDetail").innerHTML =
                                        '<div class="detail-box"><h3>Student Details</h3>' +
                                        '<p><b>ID:</b> ' + esc(s.id) + '</p>' +
                                        '<p><b>Name:</b> ' + esc(s.name) + '</p>' +
                                        '<p><b>Email:</b> ' + esc(s.email) + '</p>' +
                                        '<p><b>Created At:</b> ' + esc(date(s.createdAt)) +
                                        '</p><button id="closeStudent" class="secondary">Close Details</button></div>';

                                    on(dom.byId("closeStudent"), "click", function () {
                                        dom.byId("studentDetail").innerHTML = "";
                                    });
                                })
                                .catch(function (err) {
                                    self.notify(err.message, true);
                                });
                        });
                    });

                    host.querySelectorAll(".delete-student").forEach(function (button) {
                        on(button, "click", function () {
                            var student = students.filter(function (s) {
                                return String(s.id) === button.getAttribute("data-id");
                            })[0];

                            if (!student || !confirm("Delete student " + student.name + " (" +
                                student.email + ")? This cannot be undone.")) return;

                            api.delete("/admin/students/" + student.id)
                                .then(function () {
                                    students = students.filter(function (s) {
                                        return s.id !== student.id;
                                    });
                                    self.notify('Student "' + student.name + '" deleted successfully.');
                                    draw();
                                })
                                .catch(function (err) {
                                    self.notify(err.message, true);
                                });
                        });
                    });
                }

                draw();
            })
            .catch(function (err) {
                host.innerHTML = '<section class="panel notice error">' +
                    esc(err.message || "Unable to load students.") + '</section>';
            });
    };

    // ADMIN ENROLLMENTS WITH PROGRESS VIEW

    App.prototype.loadEnrollments = function () {
        var self = this;
        var host = dom.byId("adminContent");

        host.innerHTML = '<section class="panel"><h2>Student Enrollments</h2><p>Loading...</p></section>';

        api.get("/admin/enrollments")
            .then(function (items) {
                function draw(term) {
                    var filtered = items.filter(function (i) {
                        return [
                            i.studentName, i.studentEmail, i.courseTitle,
                            i.courseCode, i.status, i.progressStatus
                        ].join(" ").toLowerCase().indexOf((term || "").toLowerCase()) >= 0;
                    });

                    var enrolled = items.filter(function (i) {
                        return i.status === "ENROLLED";
                    }).length;

                    host.innerHTML = '<section class="panel"><h2>Student Enrollments</h2>' +
                        '<div class="stats"><div>Total Enrollments<strong>' + items.length +
                        '</strong></div><div>Enrolled<strong>' + enrolled +
                        '</strong></div><div>Other Statuses<strong>' + (items.length - enrolled) +
                        '</strong></div></div>' +
                        '<input id="enrollmentSearch" type="search" placeholder="Search student, email, course, status or progress..." value="' +
                        esc(term || "") + '">' +
                        '<div class="table-wrap"><table><thead><tr>' +
                        '<th>ID</th><th>Student</th><th>Email</th><th>Course</th>' +
                        '<th>Code</th><th>Status</th><th>Course Progress</th><th>Actions</th>' +
                        '</tr></thead><tbody>' +
                        filtered.map(function (i) {
                            return '<tr><td>#' + esc(i.id) + '</td><td>' + esc(i.studentName) +
                                '</td><td>' + esc(i.studentEmail) + '</td><td>' + esc(i.courseTitle) +
                                '</td><td>' + esc(i.courseCode) + '</td><td>' + esc(i.status) +
                                '</td><td>' + esc(i.progressStatus || "NOT_STARTED") +
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

                    host.querySelectorAll(".delete-enrollment").forEach(function (button) {
                        on(button, "click", function () {
                            var item = items.filter(function (i) {
                                return String(i.id) === button.getAttribute("data-id");
                            })[0];

                            if (!item || !confirm("Delete enrollment for " +
                                item.studentName + " in " + item.courseTitle + "?")) return;

                            api.delete("/admin/enrollments/" + item.id)
                                .then(function () {
                                    items = items.filter(function (i) {
                                        return i.id !== item.id;
                                    });
                                    self.notify("Enrollment deleted successfully.");
                                    draw(dom.byId("enrollmentSearch").value);
                                })
                                .catch(function (err) {
                                    self.notify(err.message, true);
                                });
                        });
                    });
                }

                draw("");
            })
            .catch(function (err) {
                host.innerHTML = '<section class="panel notice error">' +
                    esc(err.message || "Unable to load enrollments.") + '</section>';
            });
    };

    // ADMIN COURSE MANAGEMENT

    App.prototype.loadAdminCourses = function () {
        var self = this;
        var host = dom.byId("adminContent");

        api.get("/courses")
            .then(function (courses) {
                host.innerHTML = '<section class="panel"><h2>Add New Course</h2>' +
                    '<form id="courseForm" class="form-grid">' +
                    '<label>Course Title<input name="title" maxlength="150" required placeholder="e.g. Java Programming"></label>' +
                    '<label>Course Code<input name="courseCode" maxlength="50" required placeholder="e.g. CS101"></label>' +
                    '<label>Credits<input name="credits" type="number" min="1" step="1" value="3" required></label>' +
                    '<label class="wide">Description<textarea name="description" maxlength="1000" rows="4"></textarea></label>' +
                    '<button class="primary" type="submit">Add Course</button></form></section>' +
                    '<section class="panel"><h2>Available Courses (' + courses.length +
                    ')</h2><div class="grid" id="adminCourseList">' +
                    courses.map(function (c) {
                        return '<article class="course-card"><span class="pill">' +
                            esc(c.courseCode) + '</span><h3>' + esc(c.title) + '</h3><p>' +
                            esc(c.description || "No description provided.") +
                            '</p><p><b>Credits:</b> ' + esc(c.credits) + '</p></article>';
                    }).join("") + '</div></section>';

                on(dom.byId("courseForm"), "submit", function (e) {
                    e.preventDefault();
                    var form = e.target;
                    var credits = Number(form.credits.value);

                    if (!Number.isInteger(credits) || credits <= 0) {
                        return self.notify("Credits must be a positive whole number.", true);
                    }

                    api.post("/courses", {
                        title: form.title.value.trim(),
                        courseCode: form.courseCode.value.trim(),
                        description: form.description.value.trim(),
                        credits: credits
                    })
                        .then(function (course) {
                            self.notify('Course "' + course.title + '" created successfully.');
                            self.loadAdminCourses();
                        })
                        .catch(function (err) {
                            self.notify(err.message || "Unable to create course.", true);
                        });
                });
            })
            .catch(function (err) {
                host.innerHTML = '<section class="panel notice error">' +
                    esc(err.message || "Unable to load courses.") + '</section>';
            });
    };

    // ADMIN DOCUMENTS

    App.prototype.loadDocuments = function () {
        var host = dom.byId("adminContent");
        if (!host) return;

        host.innerHTML = "";
        var widget = new DocumentUploadWidget();

        widget.onUploadSuccess = function (response) {
            console.log("Uploaded document:", response);
        };

        widget.placeAt(host);
    };

    return App;
});


define([
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/on",
    "app/services/Api",
    "app/widgets/StudentDashboard",
    "app/widgets/CourseCard"
], function (dom, domConstruct, on, api, Dashboard, CourseCard) {

    function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
        });
    }

    return {
        render: function (app) {
            app.root.innerHTML = Dashboard.render(
                app.header("Student Dashboard"), app.user, app.noticeHTML()
            );
            app.bindLogout();

            Promise.all([
                api.get("/courses"),
                api.get("/student/enrollments")
            ]).then(function (r) {
                app.courses = r[0] || [];
                app.enrollments = r[1] || [];
                this.showCourses(app);
                this.showEnrollments(app);

                on(dom.byId("courseSearch"), "input", function (e) {
                    app.courseSearch = e.target.value;
                    this.showCourses(app);
                }.bind(this));
            }.bind(this)).catch(function (e) {
                app.notify(e.message, true);
            });
        },

        showCourses: function (app) {
            var term = (app.courseSearch || "").toLowerCase();
            var courses = (app.courses || []).filter(function (c) {
                return [c.title, c.courseCode, c.description].some(function (v) {
                    return String(v || "").toLowerCase().includes(term);
                });
            });

            dom.byId("courseList").innerHTML = courses.length
                ? '<div class="grid">' + courses.map(function (c) {
                    var enrolled = (app.enrollments || []).some(function (e) {
                        return e.courseId === c.id && e.status === "ENROLLED";
                    });
                    return CourseCard.render(c, enrolled);
                }).join("") + '</div>'
                : "<p>No matching courses found.</p>";

            dom.byId("courseList").querySelectorAll(".enroll-course").forEach(function (b) {
                on(b, "click", function () {
                    this.enroll(app, b.getAttribute("data-id"));
                }.bind(this));
            });

            dom.byId("courseList").querySelectorAll(".details-course").forEach(function (b) {
                on(b, "click", function () {
                    this.showDetails(app, b.getAttribute("data-id"));
                }.bind(this));
            });
        },

        showEnrollments: function (app) {
            var items = (app.enrollments || []).filter(function (e) {
                return e.status === "ENROLLED";
            });

            dom.byId("myEnrollments").innerHTML = items.length
                ? items.map(function (e) {
                    return '<div class="list-row"><strong>' + esc(e.courseTitle) +
                        '</strong><span>' + esc(e.courseCode) +
                        '</span><span class="pill">' + esc(e.status) + '</span></div>';
                }).join("")
                : "<p>You have not enrolled in any courses yet.</p>";
        },

        enroll: function (app, id) {
            Promise.resolve(api.post("/student/enrollments", {
                courseId: Number(id)
            })).then(function () {
                app.notify("Successfully enrolled in the course!");
                return Promise.all([
                    api.get("/courses"),
                    api.get("/student/enrollments")
                ]);
            }).then(function (r) {
                app.courses = r[0] || [];
                app.enrollments = r[1] || [];
                this.showCourses(app);
                this.showEnrollments(app);
            }.bind(this)).catch(function (e) {
                app.notify(e.message, true);
            });
        },

        showDetails: function (app, id) {
            api.get("/courses/" + encodeURIComponent(id)).then(function (c) {
                var enrolled = (app.enrollments || []).some(function (e) {
                    return e.courseId === c.id && e.status === "ENROLLED";
                });

                var panel = domConstruct.toDom(
                    '<section class="panel">' +
                    '<button id="closeCourse" class="secondary">Back</button>' +
                    '<h2>' + esc(c.title) + '</h2>' +
                    '<p><b>Course ID:</b> ' + esc(c.id) + '</p>' +
                    '<p><b>Course Code:</b> ' + esc(c.courseCode) + '</p>' +
                    '<p>' + esc(c.description) + '</p>' +
                    '<p><b>Credits:</b> ' + esc(c.credits) + '</p>' +
                    '<p><b>Status:</b> ' + (enrolled ? "Enrolled" : "Not enrolled") + '</p>' +
                    '<button id="detailEnroll" class="primary"' +
                    (enrolled ? " disabled" : "") + '>Enroll Now</button></section>'
                );

                app.root.querySelector(".page").innerHTML =
                    app.header("Course Details") + '<div id="notice"></div>';
                app.root.querySelector(".page").appendChild(panel);
                app.bindLogout();

                on(dom.byId("closeCourse"), "click", function () {
                    this.render(app);
                }.bind(this));

                on(dom.byId("detailEnroll"), "click", function () {
                    this.enroll(app, c.id);
                    this.render(app);
                }.bind(this));
            }).catch(function (e) {
                app.notify(e.message, true);
            });
        }
    };
});

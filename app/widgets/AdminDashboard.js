define([
    "dojo/on",
    "app/controllers/AdminController",
    "app/services/Logger",
    "app/services/Properties"
], function (on, AdminController, Logger, Properties) {
    return {
        render: function (app, parent) {
            var controller = new AdminController(app);

            parent.innerHTML = [
                '<div class="container-fluid px-4 py-3">',
                '<div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">',
                '<div><h3 class="fw-bold text-dark mb-0">' + Properties.get("app.header.admin", "Administrator Dashboard") + '</h3>',
                '<small class="text-muted">Manage registered students, courses, enrollments, and document annotations</small></div>',
                '</div>',
                '<ul class="nav nav-pills mb-4 bg-white p-2 rounded shadow-sm" id="adminTabsNav">',
                '<li class="nav-item"><button class="nav-link active fw-semibold" data-tab="students"><i class="bi bi-people-fill me-2"></i>Students</button></li>',
                '<li class="nav-item"><button class="nav-link fw-semibold" data-tab="enrollments"><i class="bi bi-card-checklist me-2"></i>Enrollments</button></li>',
                '<li class="nav-item"><button class="nav-link fw-semibold" data-tab="courses"><i class="bi bi-book-fill me-2"></i>Courses</button></li>',
                '<li class="nav-item"><button class="nav-link fw-semibold" data-tab="documents"><i class="bi bi-file-earmark-pdf-fill me-2"></i>Documents & Annotations</button></li>',
                '</ul>',
                '<div id="adminTabContent"></div>',
                '</div>'
            ].join("");

            var host = parent.querySelector("#adminTabContent");

            function switchTab(tabName) {
                Logger.info("AdminDashboard", "Switched to tab: " + tabName);
                parent.querySelectorAll("#adminTabsNav .nav-link").forEach(function (btn) {
                    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
                });
                if (tabName === "students") controller.loadStudents(host);
                if (tabName === "enrollments") controller.loadEnrollments(host);
                if (tabName === "courses") controller.loadCourses(host);
                if (tabName === "documents") controller.loadDocuments(host);
            }

            parent.querySelectorAll("#adminTabsNav .nav-link").forEach(function (btn) {
                on(btn, "click", function () {
                    switchTab(btn.getAttribute("data-tab"));
                });
            });

            switchTab("students");
        }
    };
});

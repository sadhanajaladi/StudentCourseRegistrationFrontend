define([
    "dojo/on",
    "app/controllers/StudentController",
    "app/services/Logger",
    "app/services/Properties"
], function (on, StudentController, Logger, Properties) {
    function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    return {
        render: function (app, parent, user) {
            var controller = new StudentController(app);

            parent.innerHTML = [
                '<div class="dashboard-layout">',
                '<aside class="dashboard-sidebar" aria-label="Student menu">',
                '<div class="dashboard-sidebar-heading">My workspace</div>',
                '<ul class="nav nav-pills flex-column" id="studentTabsNav">',
                '<li class="nav-item"><button class="nav-link active fw-semibold" data-tab="courses"><i class="bi bi-grid-fill me-2"></i>Available Courses</button></li>',
                '<li class="nav-item"><button class="nav-link fw-semibold" data-tab="enrollments"><i class="bi bi-check-circle-fill me-2"></i>My Enrollments</button></li>',
                '<li class="nav-item"><button class="nav-link fw-semibold" data-tab="documents"><i class="bi bi-file-earmark-arrow-up-fill me-2"></i>My Documents</button></li>',
                '</ul>',
                '</aside>',
                '<section class="dashboard-main">',
                '<div class="card shadow-sm border-0 mb-4 bg-white">',
                '<div class="card-body p-4 d-flex align-items-center">',
                '<div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fs-2 fw-bold me-4" style="width: 64px; height: 64px;">',
                esc((user && user.name ? user.name.charAt(0) : "S").toUpperCase()),
                '</div>',
                '<div>',
                '<h4 class="fw-bold mb-1">' + esc(user ? user.name : "Student") + '</h4>',
                '<p class="text-muted mb-0"><i class="bi bi-envelope me-1"></i>' + esc(user ? user.email : "") + ' | <span class="badge bg-primary">Student</span></p>',
                '</div></div></div>',
                '<div id="studentTabContent" class="dashboard-content"></div>',
                '</section>',
                '</div>'
            ].join("");

            var host = parent.querySelector("#studentTabContent");

            function switchTab(tabName) {
                Logger.info("StudentDashboard", "Switched to tab: " + tabName);
                parent.querySelectorAll("#studentTabsNav .nav-link").forEach(function (btn) {
                    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
                });
                if (tabName === "courses") controller.loadAvailableCourses(host);
                if (tabName === "enrollments") controller.loadMyEnrollments(host);
                if (tabName === "documents") controller.loadDocuments(host);
            }

            parent.querySelectorAll("#studentTabsNav .nav-link").forEach(function (btn) {
                on(btn, "click", function () {
                    switchTab(btn.getAttribute("data-tab"));
                });
            });

            switchTab("courses");
        }
    };
});

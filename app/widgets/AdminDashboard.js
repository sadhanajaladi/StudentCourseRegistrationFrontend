define([
    "dojo/on",
    "app/controllers/AdminController",
    "app/services/Logger"
], function (on, AdminController, Logger) {
    return {
        render: function (app, parent) {
            var controller = new AdminController(app);

            parent.innerHTML = [
                '<div class="dashboard-layout">',
                '<aside class="dashboard-sidebar" aria-label="Administrator menu">',
                '<div class="dashboard-admin-profile">',
                '<div class="dashboard-admin-avatar" id="adminProfileAvatar" aria-hidden="true"></div>',
                '<div class="dashboard-admin-details">',
                '<div class="dashboard-admin-name" id="adminProfileName"></div>',
                '<div class="dashboard-admin-email" id="adminProfileEmail"></div>',
                '<span class="dashboard-admin-role">Administrator</span>',
                '</div></div>',
                '<button type="button" class="dashboard-tree-root" id="academicRecordsToggle" aria-expanded="false" aria-controls="adminTabsNav">📁 Academic Records</button>',
                '<ul class="nav nav-pills flex-column dashboard-tree-children" id="adminTabsNav" hidden>',
                '<li class="nav-item"><button class="nav-link active fw-semibold" data-tab="students"><span class="dashboard-tree-icon" aria-hidden="true">👥</span>Students</button></li>',
                '<li class="nav-item"><button class="nav-link fw-semibold" data-tab="enrollments"><span class="dashboard-tree-icon" aria-hidden="true">🧾</span>Enrollments</button></li>',
                '<li class="nav-item"><button class="nav-link fw-semibold" data-tab="courses"><span class="dashboard-tree-icon" aria-hidden="true">📚</span>Courses</button></li>',
                '<li class="nav-item"><button class="nav-link fw-semibold" data-tab="documents"><span class="dashboard-tree-icon" aria-hidden="true">📄</span>Documents</button></li>',
                '</ul>',
                '</aside>',
                '<section class="dashboard-main">',
                '<div class="dashboard-workspace-header" id="adminWorkspaceHeader" hidden>',
                '<div class="dashboard-workspace-title"><span id="adminWorkspaceIcon" aria-hidden="true">👥</span><h3 id="adminWorkspaceTitle" class="fw-bold text-dark mb-0">Students</h3></div>',
                '<div class="dashboard-workspace-tabs" role="tablist" aria-label="Open workspace">',
                '<button type="button" class="dashboard-workspace-tab active" role="tab" aria-selected="true" data-tab="students">👥 Students</button>',
                '<button type="button" class="dashboard-workspace-tab" role="tab" aria-selected="false" data-tab="enrollments">🧾 Enrollments</button>',
                '<button type="button" class="dashboard-workspace-tab" role="tab" aria-selected="false" data-tab="courses">📚 Courses</button>',
                '<button type="button" class="dashboard-workspace-tab" role="tab" aria-selected="false" data-tab="documents">📄 Documents</button>',
                '</div>',
                '</div>',
                '<div id="adminTabContent" class="dashboard-content dashboard-home">',
                '<div class="dashboard-welcome"><div class="dashboard-welcome-icon" aria-hidden="true">🎓</div>',
                '<h1>Welcome to INNOVA</h1>',
                '</div></div>',
                '</section>',
                '</div>'
            ].join("");

            var host = parent.querySelector("#adminTabContent");
            var folderToggle = parent.querySelector("#academicRecordsToggle");
            var folderItems = parent.querySelector("#adminTabsNav");
            var workspaceHeader = parent.querySelector("#adminWorkspaceHeader");
            var adminUser = app.user || {};
            var adminName = String(adminUser.name || "Administrator");
            parent.querySelector("#adminProfileName").textContent = adminName;
            parent.querySelector("#adminProfileEmail").textContent = adminUser.email || "";
            parent.querySelector("#adminProfileAvatar").textContent = adminName.charAt(0).toUpperCase();
            var tabLabels = {
                students: { title: "Students", icon: "👥" },
                enrollments: { title: "Enrollments", icon: "🧾" },
                courses: { title: "Courses", icon: "📚" },
                documents: { title: "Documents", icon: "📄" }
            };

            function openAcademicRecords() {
                folderItems.hidden = false;
                folderToggle.setAttribute("aria-expanded", "true");
            }

            function showWelcome() {
                workspaceHeader.hidden = true;
                host.className = "dashboard-content dashboard-home";
                host.innerHTML = [
                    '<div class="dashboard-welcome">',
                    '<div class="dashboard-welcome-icon" aria-hidden="true">🎓</div>',
                    '<h1>Welcome to INNOVA</h1>',
                    '</div>'
                ].join("");
            }

            on(folderToggle, "click", function () {
                var isExpanded = folderToggle.getAttribute("aria-expanded") === "true";
                if (isExpanded) {
                    folderToggle.setAttribute("aria-expanded", "false");
                    folderItems.hidden = true;
                    showWelcome();
                } else {
                    openAcademicRecords();
                }
            });

            function switchTab(tabName) {
                if (!tabLabels[tabName]) return;
                Logger.info("AdminDashboard", "Switched to tab: " + tabName);
                folderItems.hidden = false;
                folderToggle.setAttribute("aria-expanded", "true");
                workspaceHeader.hidden = false;
                host.classList.remove("dashboard-home");
                parent.querySelectorAll("#adminTabsNav .nav-link").forEach(function (btn) {
                    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
                });
                parent.querySelectorAll(".dashboard-workspace-tab").forEach(function (btn) {
                    var isActive = btn.getAttribute("data-tab") === tabName;
                    btn.classList.toggle("active", isActive);
                    btn.setAttribute("aria-selected", isActive ? "true" : "false");
                });
                parent.querySelector("#adminWorkspaceTitle").textContent = tabLabels[tabName].title;
                parent.querySelector("#adminWorkspaceIcon").textContent = tabLabels[tabName].icon;
                if (tabName === "students") controller.loadStudents(host);
                if (tabName === "enrollments") controller.loadEnrollments(host);
                if (tabName === "courses") controller.loadCourses(host);
                if (tabName === "documents") controller.loadDocuments(host);
            }

            parent.querySelectorAll("#adminTabsNav .nav-link, .dashboard-workspace-tab").forEach(function (btn) {
                on(btn, "click", function () {
                    switchTab(btn.getAttribute("data-tab"));
                });
            });
        }
    };
});

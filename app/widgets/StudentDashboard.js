
define([], function () {

    function escapeHTML(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[c];
        });
    }

    return {
        render: function (headerHTML, user, noticeHTML) {

            var name = user.name || "Student";

            return '<div class="page">' +

                headerHTML +

                '<section class="panel profile">' +
                    '<div class="avatar">' +
                        escapeHTML(name.charAt(0).toUpperCase()) +
                    '</div>' +
                    '<div>' +
                        '<h2>My Profile</h2>' +
                        '<p><b>Name:</b> ' + escapeHTML(user.name) + '</p>' +
                        '<p><b>Email:</b> ' + escapeHTML(user.email) + '</p>' +
                        '<p><b>Role:</b> ' + escapeHTML(user.role) + '</p>' +
                    '</div>' +
                '</section>' +

                '<div id="notice">' + noticeHTML + '</div>' +

                '<nav class="tabs student-tabs">' +
                    '<button class="tab active" data-student-tab="courses">Available Courses</button>' +
                    '<button class="tab" data-student-tab="enrollments">My Enrollments</button>' +
                    '<button class="tab" data-student-tab="documents">My Documents</button>' +
                '</nav>' +

                '<section class="panel" id="studentCourses">' +
                    '<h2>Available Courses</h2>' +
                    '<input id="courseSearch" type="search" placeholder="Search by course name, code, or description...">' +
                    '<div id="courseList">Loading courses...</div>' +
                '</section>' +

                '<section class="panel" id="studentEnrollments" style="display:none;">' +
                    '<h2>My Enrollments</h2>' +
                    '<div id="myEnrollments">Loading enrollments...</div>' +
                '</section>' +

                '<section class="panel" id="studentDocuments" style="display:none;">' +
                    '<div id="studentDocumentContent"></div>' +
                '</section>' +

            '</div>';
        }
    };
});

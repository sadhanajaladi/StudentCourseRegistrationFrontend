define([], function () {
    function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    return {
        render: function (course, enrolled) {
            return '<div class="card shadow-sm border-0 mb-3">' +
                '<div class="card-body">' +
                '<div class="d-flex justify-content-between align-items-center mb-2">' +
                '<span class="badge bg-primary fs-6">' + esc(course.courseCode) + '</span>' +
                '<span class="text-muted small fw-semibold">' + esc(course.credits) + ' Credits</span>' +
                '</div>' +
                '<h5 class="card-title fw-bold text-dark">' + esc(course.title) + '</h5>' +
                '<p class="card-text text-muted">' + esc(course.description || "No description available.") + '</p>' +
                '<div class="d-flex justify-content-end gap-2">' +
                '<button class="btn btn-outline-secondary btn-sm details-course" data-id="' + esc(course.id) + '">Details</button>' +
                '<button class="btn btn-primary btn-sm enroll-course" data-id="' + esc(course.id) + '"' + (enrolled ? " disabled" : "") + '>' +
                (enrolled ? "Enrolled" : "Enroll Now") + '</button>' +
                '</div></div></div>';
        }
    };
});


define([], function () {
    return {
        render: function (headerHTML, noticeHTML) {
            return '<div class="page">' + headerHTML +

                '<nav class="tabs">' +
                    '<button data-tab="students" class="tab active">Students</button>' +
                    '<button data-tab="enrollments" class="tab">Enrollments</button>' +
                    '<button data-tab="courses" class="tab">Courses</button>' +
                    '<button data-tab="documents" class="tab">Documents</button>' +
                '</nav>' +

                '<div id="notice">' + noticeHTML + '</div>' +
                '<div id="adminContent"></div>' +

            '</div>';
        }
    };
});

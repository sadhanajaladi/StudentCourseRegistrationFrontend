define([], function () {
  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }
  return {
    render: function (course, enrolled) {
      return '<article class="course-card"><h3>' + escapeHTML(course.title) + '</h3><p><b>Code:</b> ' + escapeHTML(course.courseCode) +
        '</p><p>' + escapeHTML(course.description || "No description available.") + '</p><p><b>Credits:</b> ' + escapeHTML(course.credits) + '</p>' +
        '<button class="secondary details-course" data-id="' + escapeHTML(course.id) + '">View Details</button> ' +
        '<button class="primary enroll-course" data-id="' + escapeHTML(course.id) + '"' + (enrolled ? " disabled" : "") + '>' +
        (enrolled ? "Enrolled" : "Enroll Now") + '</button></article>';
    }
  };
});

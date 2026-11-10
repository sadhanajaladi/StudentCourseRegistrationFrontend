define([], function () {
  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }
  return {
    render: function (title, user) {
      var roleName = user.role === "ADMIN" ? "Administrator" : "Student";
      return '<header class="topbar"><div><h1>' + escapeHTML(title) + '</h1><p>Welcome, ' +
        escapeHTML(user.name || roleName) + '</p></div><button id="logout" class="secondary">Logout</button></header>';
    }
  };
});

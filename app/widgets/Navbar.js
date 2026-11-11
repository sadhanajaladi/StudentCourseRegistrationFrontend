define([
    "dojo/dom-construct",
    "dijit/form/Button",
    "app/services/Properties"
], function (domConstruct, Button, Properties) {
    function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    return {
        render: function (parent, title, user, onLogout) {
            var roleBadge = (user && user.role === "ADMIN")
                ? '<span class="badge bg-warning text-dark ms-2">Administrator</span>'
                : '<span class="badge bg-light text-primary ms-2">Student</span>';

            var navHtml = '<nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm mb-4">' +
                '<div class="container-fluid px-4">' +
                '<span class="navbar-brand fw-bold fs-4">' + Properties.get("app.navbar.title", "Student Registration") + '</span>' +
                '<div class="d-flex align-items-center ms-auto">' +
                '<div class="text-white me-3 text-end d-none d-sm-block">' +
                '<div class="fw-semibold">' + esc(user ? user.name : "") + roleBadge + '</div>' +
                '<small class="text-white-50">' + esc(user ? user.email : "") + '</small>' +
                '</div>' +
                '<div id="navbarLogoutSlot"></div>' +
                '</div></div></nav>';

            var container = domConstruct.create("div", { innerHTML: navHtml }, parent, "first");
            var logoutSlot = container.querySelector("#navbarLogoutSlot");

            var logoutBtn = new Button({
                label: Properties.get("btn.logout", "Logout"),
                class: "btn btn-outline-light btn-sm fw-semibold",
                onClick: onLogout
            }, domConstruct.create("button", {}, logoutSlot));
            logoutBtn.startup();

            return container;
        }
    };
});

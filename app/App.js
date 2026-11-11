define([
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/on",
    "app/services/Api",
    "app/services/Logger",
    "app/services/Properties",
    "app/controllers/AuthController",
    "app/widgets/Navbar",
    "app/widgets/Login",
    "app/widgets/Signup",
    "app/widgets/AdminDashboard",
    "app/widgets/StudentDashboard"
], function (dom, domConstruct, on, api, Logger, Properties, AuthController, Navbar, LoginWidget, SignupWidget, AdminDashboard, StudentDashboard) {

    function App() {
        this.root = dom.byId("app");
        this.user = null;
        this.route = location.hash || "#/login";
    }

    App.prototype.start = function () {
        var self = this;
        Logger.info("App", "Application initializing");

        on(window, "hashchange", function () {
            self.route = location.hash;
            self.render();
        });

        if (localStorage.getItem("jwtToken")) {
            Logger.info("App", "JWT token detected, validating session");
            AuthController.getCurrentUser()
                .then(function (user) {
                    self.user = user;
                    Logger.info("App", "User authenticated: " + user.email + " (" + user.role + ")");
                    self.go(user.role === "ADMIN" ? "#/admin" : "#/student");
                })
                .catch(function (err) {
                    Logger.warn("App", "Session invalid, clearing storage", err);
                    AuthController.clearSession();
                    self.go("#/login");
                });
        } else {
            this.go(this.route === "#/register" ? "#/register" : "#/login");
        }
    };

    App.prototype.go = function (route) {
        if (location.hash !== route) location.hash = route;
        this.route = route;
        this.render();
    };

    App.prototype.notify = function (msg, isError) {
        var host = dom.byId("globalNotificationArea");
        if (!host) return;
        var alertClass = isError ? "alert-danger" : "alert-success";
        var icon = isError ? "&#9888;" : "&#10004;";
        host.innerHTML = '<div class="alert ' + alertClass + ' alert-dismissible fade show shadow-sm" role="alert">' +
            '<span class="me-2">' + icon + '</span>' + msg +
            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
            '</div>';
        setTimeout(function () {
            if (host.innerHTML.indexOf(msg) >= 0) host.innerHTML = "";
        }, 5000);
    };

    App.prototype.render = function () {
        if (!this.root) return;
        if (!this.user && this.route !== "#/register") return this.renderLogin();
        if (!this.user && this.route === "#/register") return this.renderSignup();
        if (this.user.role === "ADMIN") return this.renderAdmin();
        this.renderStudent();
    };

    App.prototype.renderLogin = function () {
    var self = this;

    // Clear the previous dashboard before showing login
    domConstruct.empty(this.root);

    LoginWidget.render(this.root, function (email, password) {
        return AuthController.login(email, password)
            .then(function (user) {
                self.user = user;

                self.go(
                    user.role === "ADMIN"
                        ? "#/admin"
                        : "#/student"
                );
            })
            .catch(function (err) {
                var notice = dom.byId("authNotice");

                if (notice) {
                    notice.innerHTML =
                        '<div class="alert alert-danger py-2">' +
                        (err.message || "Invalid email or password.") +
                        '</div>';
                }

                throw err;
            });
    });
};

    App.prototype.renderSignup = function () {
    var self = this;

    domConstruct.empty(this.root);

    SignupWidget.render(this.root, function (payload) {
        return AuthController.signup(payload)
            .then(function () {
                var notice = dom.byId("authNotice");

                if (notice) {
                    notice.innerHTML =
                        '<div class="alert alert-success py-2">' +
                        'Registration successful! You may now sign in.' +
                        '</div>';
                }
            })
            .catch(function (err) {
                var notice = dom.byId("authNotice");

                if (notice) {
                    notice.innerHTML =
                        '<div class="alert alert-danger py-2">' +
                        (err.message || "Registration failed.") +
                        '</div>';
                }

                throw err;
            });
    });
};
    App.prototype.renderAdmin = function () {
        var self = this;
        this.root.innerHTML = '<div id="adminAppContainer"><div id="globalNotificationArea" class="container-fluid px-4 pt-3"></div><div id="adminViewContainer"></div></div>';
        Navbar.render(dom.byId("adminAppContainer"), Properties.get("app.header.admin"), this.user, function () {
            self.logout();
        });
        AdminDashboard.render(this, dom.byId("adminViewContainer"));
    };

    App.prototype.renderStudent = function () {
        var self = this;
        this.root.innerHTML = '<div id="studentAppContainer"><div id="globalNotificationArea" class="container-fluid px-4 pt-3"></div><div id="studentViewContainer"></div></div>';
        Navbar.render(dom.byId("studentAppContainer"), Properties.get("app.header.student"), this.user, function () {
            self.logout();
        });
        StudentDashboard.render(this, dom.byId("studentViewContainer"), this.user);
    };

    App.prototype.logout = function () {
        var self = this;
        Logger.info("App", "User logging out");
        AuthController.logout().finally(function () {
            AuthController.clearSession();
            self.user = null;
            self.go("#/login");
        });
    };

    return App;
});

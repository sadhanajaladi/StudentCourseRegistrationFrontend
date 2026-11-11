define(["app/services/Api", "app/services/Logger"], function (api, logger) {
    return {
        login: function (email, password) {
            logger.info("AuthController", "Initiating login for " + email);
            return api.post("/auth/login", { email: email, password: password })
                .then(function (data) {
                    if (!data.token) throw new Error("Authentication response missing JWT token");
                    localStorage.setItem("jwtToken", data.token);
                    logger.info("AuthController", "Login successful for " + email + " [Role: " + data.role + "]");
                    return data;
                });
        },

        signup: function (user) {
            logger.info("AuthController", "Initiating signup for " + user.email);
            return api.post("/auth/signup", user).then(function (res) {
                logger.info("AuthController", "Signup successful for " + user.email);
                return res;
            });
        },

        logout: function () {
    logger.info("AuthController", "Logging out user session");

    return api.post("/auth/logout", {})
        .then(function (response) {
            logger.info("AuthController", "Backend logout successful");
            return response;
        })
        .catch(function (error) {
            logger.warn(
                "AuthController",
                "Backend logout failed; clearing local session",
                error
            );
        })
        .finally(function () {
            localStorage.removeItem("jwtToken");
            logger.info("AuthController", "Local session cleared");
        });
},
        getCurrentUser: function () {
            logger.debug("AuthController", "Validating current user session");
            return api.get("/auth/me");
        },

        clearSession: function () {
            logger.info("AuthController", "Clearing local session token");
            localStorage.removeItem("jwtToken");
        }
    };
});


define(["app/services/Api"], function (api) {

    return {
        login: function (email, password) {
            return api.post("/auth/login", {
                email: email,
                password: password
            }).then(function (data) {
                if (!data.token) throw new Error("JWT token missing");
                localStorage.setItem("jwtToken", data.token);
                return data;
            });
        },

        signup: function (user) {
            return api.post("/auth/signup", user);
        },

       logout: function () {
    return api.post("/auth/logout", {}).catch(function () {
        // Continue logout even if the backend request fails
    }).then(function () {
        localStorage.removeItem("jwtToken");
    });
},

        getCurrentUser: function () {
            return api.get("/auth/me");
        },

        clearSession: function () {
            localStorage.removeItem("jwtToken");
        }
    };
});

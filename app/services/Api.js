define(["app/config"], function (config) {
  function request(path, options) {
    options = options || {};
    var headers = options.headers || {};
    var token = localStorage.getItem("jwtToken");
    if (token) headers.Authorization = "Bearer " + token;
    if (!(options.body instanceof FormData) && options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }
    return fetch(config.API_BASE_URL + path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body
    }).then(function (response) {
      if (response.status === 204) return null;
      var contentType = response.headers.get("content-type") || "";
      return (contentType.indexOf("application/json") >= 0
        ? response.json()
        : response.text()).then(function (data) {
          if (!response.ok) {
            var error = new Error((data && data.message) || data || response.statusText);
            error.status = response.status;
            throw error;
          }
          return data;
        });
    });
  }
  return {
    get: function (path) { return request(path); },
    post: function (path, body) { return request(path, { method: "POST", body: body }); },
    put: function (path, body) { return request(path, { method: "PUT", body: body }); },
    delete: function (path) { return request(path, { method: "DELETE" }); }
  };
});

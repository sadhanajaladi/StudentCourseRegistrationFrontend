define(["app/services/Properties"], function (Properties) {
    // Read local Java-style key=value configuration, similar to Spring Boot.
    // Never put passwords, JWT secrets or other credentials in this client file.
    var properties = Properties.loadSync("app/config.properties");
    return {
        API_BASE_URL: properties["app.api.base-url"] || "http://localhost:8080/api",
        OFFLINE_SHELL_CACHE: properties["app.offline.shell-cache"] === "true",
        LOG_LEVEL: properties["app.logging.level"] || "INFO",
        REQUEST_TIMEOUT_MS: Number(properties["app.request.timeout-ms"] || 30000)
    };
});

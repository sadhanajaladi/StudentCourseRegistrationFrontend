define(["app/config"], function (config) {
    var LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
    var currentLevel = LEVELS[((config && config.LOG_LEVEL) || "DEBUG").toUpperCase()] || 0;

    function write(level, context, message, details) {
        if ((LEVELS[level] || 0) < currentLevel) return;
        var timestamp = new Date().toISOString();
        var prefix = "[" + timestamp + "] [" + level + "] [" + context + "] " + message;
        var entry = { timestamp: timestamp, level: level, context: context, message: message };
        if (details !== undefined) entry.details = details && details.message ? details.message : details;

        if (window.console) {
            var consoleMethod = level === "ERROR" ? "error" : (level === "WARN" ? "warn" : (level === "INFO" ? "info" : "log"));
            if (details !== undefined) {
                console[consoleMethod](prefix, details);
            } else {
                console[consoleMethod](prefix);
            }
        }

        try {
            var buffer = JSON.parse(localStorage.getItem("frontendLogBuffer") || "[]");
            buffer.push(entry);
            if (buffer.length > 250) buffer = buffer.slice(-250);
            localStorage.setItem("frontendLogBuffer", JSON.stringify(buffer));
        } catch (ignore) {}
    }

    return {
        debug: function (context, msg, d) { write("DEBUG", context, msg, d); },
        info: function (context, msg, d) { write("INFO", context, msg, d); },
        warn: function (context, msg, d) { write("WARN", context, msg, d); },
        error: function (context, msg, d) { write("ERROR", context, msg, d); },
        getLogs: function () {
            try { return JSON.parse(localStorage.getItem("frontendLogBuffer") || "[]"); } catch (e) { return []; }
        },
        clearLogs: function () { localStorage.removeItem("frontendLogBuffer"); }
    };
});

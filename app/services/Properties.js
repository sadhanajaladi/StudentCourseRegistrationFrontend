define([], function () {
    var cache = {};

    function loadSync(url) {
        if (cache[url]) return cache[url];
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        try {
            xhr.send(null);
        } catch (e) {
            console.warn("Could not load properties from " + url, e);
            return {};
        }
        if (xhr.status !== 200 && xhr.status !== 0) {
            console.warn("Properties file status " + xhr.status + " for " + url);
            return {};
        }
        var values = {};
        xhr.responseText.split(/\r?\n/).forEach(function (line) {
            var trimmed = line.trim();
            if (!trimmed || trimmed.charAt(0) === "#" || trimmed.charAt(0) === "!") return;
            var separator = trimmed.indexOf("=");
            if (separator < 0) separator = trimmed.indexOf(":");
            if (separator < 0) return;
            values[trimmed.substring(0, separator).trim()] = trimmed.substring(separator + 1).trim();
        });
        cache[url] = values;
        return values;
    }

    var defaultProps = loadSync("app/config.properties");

    return {
        loadSync: loadSync,
        get: function (key, defaultVal, params) {
            var val = (defaultProps && defaultProps[key] !== undefined) ? defaultProps[key] : (defaultVal !== undefined ? defaultVal : key);
            if (params) {
                if (Array.isArray(params)) {
                    params.forEach(function (p, idx) {
                        val = val.replace(new RegExp("\\{" + idx + "\\}", "g"), p);
                    });
                } else if (typeof params === "object") {
                    Object.keys(params).forEach(function (k) {
                        val = val.replace(new RegExp("\\{" + k + "\\}", "g"), params[k]);
                    });
                }
            }
            return val;
        },
        getAll: function () {
            return defaultProps;
        }
    };
});

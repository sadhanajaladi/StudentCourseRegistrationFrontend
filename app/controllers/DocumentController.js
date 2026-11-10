
define([
    "app/services/Api",
    "app/config"
], function (api, config) {

    function uploadData(name, type, file) {
        var data = new FormData();
        data.append("name", name);
        data.append("type", type);
        data.append("file", file);
        return data;
    }
// Student and admin document-list endpoints
    function download(path, filename) {
        return fetch(config.API_BASE_URL + path, {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("jwtToken")
            }
        }).then(function (response) {
            if (!response.ok) throw new Error("Download failed: " + response.status);
            return response.blob();
        }).then(function (blob) {
            var url = URL.createObjectURL(blob);
            var link = document.createElement("a");
            link.href = url;
            link.download = filename || "document";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(function () {
                URL.revokeObjectURL(url);
            }, 1000);
        });
    }

    return {

        // Upload first document version
        upload: function (name, type, file) {
            return api.post("/documents", uploadData(name, type, file));
        },

        // Upload a new document version
        uploadVersion: function (id, file) {
            var data = new FormData();
            data.append("file", file);
            return api.post("/documents/" + id + "/versions", data);
        },

        // Get document version history
        versions: function (id) {
            return api.get("/documents/" + id + "/versions");
        },

        // Download a particular version
        downloadVersion: function (id, version) {
            return download(
                "/documents/" + id + "/versions/" + version + "/download",
                "document-v" + version
            );
        },

        // Download latest version
        downloadLatest: function (id) {
            return download("/documents/" + id + "/download", "document");
        },

        // Check out document
        checkout: function (id) {
            return api.post("/documents/" + id + "/checkout", {});
        },

        // Check in document with a new version
        checkin: function (id, file) {
            var data = new FormData();
            data.append("file", file);
            return api.post("/documents/" + id + "/checkin", data);
        },

        // Create an annotation
        addAnnotation: function (id, version, annotation) {
            return api.post(
                "/documents/" + id + "/versions/" + version + "/annotations",
                annotation
            );
        },

        // Get annotations for a particular version
        annotations: function (id, version) {
            return api.get(
                "/documents/" + id + "/versions/" + version + "/annotations"
            );
        },

        // Get annotation count
        annotationCount: function (id) {
            return api.get("/documents/" + id + "/annotations/count");
        },

        // Document lists (endpoints to be added in backend)
        myDocuments: function () {
            return api.get("/documents/my");
        },

        allDocuments: function () {
            return api.get("/documents/admin/all");
        }
    };
});


define([
    "dojo/dom-construct",
    "app/services/Api"
], function (domConstruct, Api) {

    function DocumentUpload() {}

   
DocumentUpload.prototype.placeAt = function (parent) {

    var fragment = domConstruct.toDom(`
        <section class="document-upload">
            <h2>Upload Document</h2>

            <label>Document Name</label>
            <input type="text" id="documentName"
                   placeholder="Enter document name">

            <label>Document Type</label>
            <select id="documentType">
                <option value="ID_PROOF">ID Proof</option>
                <option value="COURSE_CERTIFICATE">Course Certificate</option>
                <option value="MARKSHEET">Marksheet</option>
                <option value="OTHER">Other</option>
            </select>

            <label>Select Document</label>
            <input type="file" id="documentFile" accept=".pdf">

            <button type="button" id="uploadDocument">
                Upload Document
            </button>

            <p id="uploadMessage"></p>
        </section>
    `);

    // Get the actual section element from the fragment
    this.container = fragment.firstElementChild;

    // Append the section to the parent
    parent.appendChild(this.container);

    // Now the button can be found
    this.bindEvents();
};


    DocumentUpload.prototype.bindEvents = function () {

        var self = this;

        var button =
            this.container.querySelector("#uploadDocument");

        console.log("Upload button element:", button);

        if (!button) {
            console.error("Upload button not found!");
            return;
        }

        button.addEventListener("click", function () {
            console.log("Upload button clicked!");
            self.uploadDocument();
        });
    };

    DocumentUpload.prototype.uploadDocument = function () {

        console.log("Upload method started!");

        var name =
            this.container.querySelector("#documentName").value.trim();

        var type =
            this.container.querySelector("#documentType").value;

        var file =
            this.container.querySelector("#documentFile").files[0];

        var message =
            this.container.querySelector("#uploadMessage");

        var button =
            this.container.querySelector("#uploadDocument");

        if (!name || !file) {
            message.textContent =
                "Please enter document name and select a PDF.";
            return;
        }

        var formData = new FormData();

        formData.append("name", name);
        formData.append("type", type);
        formData.append("file", file);

        button.disabled = true;
        message.textContent = "Uploading document...";

        Api.post("/documents", formData)
            .then(function (response) {

                console.log("Upload response:", response);

                message.textContent =
                    "Document uploaded successfully! ID: " +
                    response.documentId;

                this.container.querySelector("#documentName").value = "";
                this.container.querySelector("#documentFile").value = "";

                if (typeof this.onUploadSuccess === "function") {
                    this.onUploadSuccess(response);
                }

            }.bind(this))
            .catch(function (error) {

                console.error("Document upload error:", error);

                message.textContent =
                    "Upload failed: " + error.message;

            })
            .finally(function () {
                button.disabled = false;
            });
    };

    return DocumentUpload;
});

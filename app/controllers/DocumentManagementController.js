
define([
    "app/controllers/DocumentController"
], function (DocumentController) {

    function DocumentManagementController() {
        this.documents = [];
    }

    // Load all documents and their version histories
    DocumentManagementController.prototype.loadDocuments = function () {

        var self = this;

        return DocumentController.myDocuments()
            .then(function (documents) {

                self.documents = documents || [];

                return Promise.all(
                    self.documents.map(function (doc) {

                        return DocumentController.versions(doc.id)
                            .then(function (versions) {

                                doc.versions = versions || [];

                                doc.versions.sort(function (a, b) {
                                    return a.versionNumber - b.versionNumber;
                                });

                                return doc;
                            });
                    })
                );
            });
    };

    // Upload a new document
    DocumentManagementController.prototype.uploadDocument = function (
        name, type, file
    ) {
        return DocumentController.upload(name, type, file);
    };

    // Upload a new version
    DocumentManagementController.prototype.uploadNewVersion = function (
        documentId, file
    ) {
        return DocumentController.uploadVersion(documentId, file);
    };

    // Get version history
    DocumentManagementController.prototype.getVersionHistory = function (
        documentId
    ) {
        return DocumentController.versions(documentId);
    };

    // Open a particular PDF version
    DocumentManagementController.prototype.openVersion = function (
        documentId,
        versionNumber,
        pdfViewerController
    ) {
        return pdfViewerController.openVersion(
            documentId,
            versionNumber
        );
    };

    // Checkout document
    DocumentManagementController.prototype.checkoutDocument = function (
        documentId
    ) {
        return DocumentController.checkout(documentId);
    };

    // Check-in document with a new version
    DocumentManagementController.prototype.checkinDocument = function (
        documentId,
        file
    ) {
        return DocumentController.checkin(documentId, file);
    };

    // Refresh documents after any operation
    DocumentManagementController.prototype.refreshDocuments = function () {
        return this.loadDocuments();
    };

    return DocumentManagementController;
});

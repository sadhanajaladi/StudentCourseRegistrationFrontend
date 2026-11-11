define([
    "dijit/Dialog",
    "dijit/form/Button",
    "dojo/dom-construct",
    "dojo/on",
    "app/services/Properties"
], function (Dialog, Button, domConstruct, on, Properties) {
    return {
        show: function (options) {
            return new Promise(function (resolve) {
                var title = options.title || Properties.get("dialog.confirm.title", "Confirm Action");
                var message = options.message || "Are you sure you want to proceed?";
                var confirmLabel = options.confirmLabel || Properties.get("dialog.confirm.delete_btn", "Confirm");
                var cancelLabel = options.cancelLabel || Properties.get("dialog.confirm.cancel_btn", "Cancel");
                var isDanger = options.isDanger !== false;

                var contentNode = domConstruct.create("div", {
                    className: "p-3",
                    innerHTML: '<div class="d-flex align-items-center mb-3">' +
                        '<div class="me-3 fs-3 ' + (isDanger ? 'text-danger' : 'text-primary') + '">' +
                        (isDanger ? '&#9888;' : '&#8505;') + '</div>' +
                        '<div class="fs-6">' + message + '</div></div>' +
                        '<div class="d-flex justify-content-end gap-2 mt-4" id="confirmDialogButtons"></div>'
                });

                var dialog = new Dialog({
                    title: title,
                    content: contentNode,
                    style: "width: 440px; border-radius: 8px;",
                    closable: true,
                    onHide: function () {
                        setTimeout(function () { dialog.destroyRecursive(); }, 150);
                        resolve(false);
                    }
                });

                var buttonHost = contentNode.querySelector("#confirmDialogButtons");

                var cancelBtn = new Button({
                    label: cancelLabel,
                    class: "btn btn-secondary",
                    onClick: function () {
                        dialog.hide();
                        resolve(false);
                    }
                }, domConstruct.create("button", {}, buttonHost));
                cancelBtn.startup();

                var confirmBtn = new Button({
                    label: confirmLabel,
                    class: isDanger ? "btn btn-danger" : "btn btn-primary",
                    onClick: function () {
                        dialog.onHide = function () {
                            setTimeout(function () { dialog.destroyRecursive(); }, 150);
                        };
                        dialog.hide();
                        resolve(true);
                    }
                }, domConstruct.create("button", {}, buttonHost));
                confirmBtn.startup();

                dialog.show();
            });
        }
    };
});

define([
    "dojo/dom-construct",
    "dojo/store/Memory",
    "dojo/data/ObjectStore",
    "dojox/grid/EnhancedGrid"
], function (domConstruct, Memory, ObjectStore, EnhancedGrid) {
    return {
        createGrid: function (slot, data, structure, options) {
            options = options || {};
            var config = {
                store: new ObjectStore({ objectStore: new Memory({ data: data, idProperty: "id" }) }),
                structure: structure,
                autoHeight: options.autoHeight
            };
            if (options.selectionMode) config.selectionMode = options.selectionMode;

            var nodeOptions = { style: "width: 100%;" };
            if (options.height) nodeOptions.style = "height: " + options.height + "px; width: 100%;";
            var grid = new EnhancedGrid(config, domConstruct.create("div", nodeOptions, slot));
            grid.startup();
            return grid;
        },

        addFormField: function (form, label, Widget, options, spacing) {
            var group = domConstruct.create("div", { className: spacing }, form.domNode);
            domConstruct.create("label", {
                className: "form-label fw-semibold text-secondary",
                innerHTML: label
            }, group);

            var widget = new Widget(options, domConstruct.create("input", {}, group));
            widget.startup();
            return widget;
        }
    };
});

var fs = require("fs");
var path = require("path");
var root = path.resolve(__dirname, "..");
function copyPackage(name, destination) {
    var source = path.join(root, "node_modules", name);
    if (!fs.existsSync(source)) throw new Error("Missing " + name + ". Run npm install while online once.");
    var target = path.join(root, "vendor", destination);
    fs.rmSync(target, { recursive: true, force: true });
    fs.mkdirSync(target, { recursive: true });
    fs.cpSync(source, target, { recursive: true });
}
copyPackage("dojo", "dojo");
copyPackage("dijit", "dijit");
copyPackage("dojox", "dojox");
var bootstrapSource = path.join(root, "node_modules", "bootstrap", "dist");
var bootstrapTarget = path.join(root, "vendor", "bootstrap");
fs.rmSync(bootstrapTarget, { recursive: true, force: true });
fs.cpSync(bootstrapSource, bootstrapTarget, { recursive: true });
var pdfSource = path.join(root, "node_modules", "pdfjs-dist", "build");
var pdfTarget = path.join(root, "vendor", "pdfjs");
fs.rmSync(pdfTarget, { recursive: true, force: true });
fs.cpSync(pdfSource, pdfTarget, { recursive: true });
console.log("Local Dojo, Dijit, DojoX, Bootstrap and PDF.js assets copied to vendor/.");

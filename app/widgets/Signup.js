define([
    "dojo/dom-construct",
    "dijit/form/Form",
    "dijit/form/ValidationTextBox",
    "dijit/form/Button",
    "app/services/Properties",
    "app/services/Logger"
], function (domConstruct, Form, ValidationTextBox, Button, Properties, Logger) {
    return {
        render: function (parent, onSubmit) {
            parent.innerHTML = [
                '<div class="container min-vh-100 d-flex align-items-center justify-content-center py-5">',
                '<div class="card shadow-lg border-0" style="max-width: 480px; width: 100%; border-radius: 12px;">',
                '<div class="card-body p-4 p-md-5">',
                '<div class="text-center mb-4">',
                '<h2 class="fw-bold text-primary mb-1">' + Properties.get("auth.signup.title", "Create Student Account") + '</h2>',
                '<p class="text-muted">' + Properties.get("auth.signup.subtitle", "Register to explore courses and enroll") + '</p>',
                '</div>',
                '<div id="authNotice" class="mb-3"></div>',
                '<div id="signupFormContainer"></div>',
                '<div class="text-center mt-4">',
                '<p class="text-muted mb-0">' + Properties.get("auth.signup.login_prompt", "Already have an account?") + ' ',
                '<a href="#/login" class="fw-bold text-decoration-none">' + Properties.get("auth.signup.login_link", "Back to Login") + '</a>',
                '</p></div></div></div></div>'
            ].join("");

            var host = parent.querySelector("#signupFormContainer");
            var form = new Form({}, domConstruct.create("div", {}, host));

            // Name Field
            var nameGroup = domConstruct.create("div", { className: "mb-3" }, form.domNode);
            domConstruct.create("label", {
                className: "form-label fw-semibold text-secondary",
                innerHTML: Properties.get("label.name", "Full Name")
            }, nameGroup);
            var nameInput = new ValidationTextBox({
                name: "name",
                required: true,
                trim: true,
                regExp: Properties.get("regex.name"),
                invalidMessage: Properties.get("val.name.invalid"),
                placeHolder: "Enter your full name",
                style: "width: 100%;"
            }, domConstruct.create("input", {}, nameGroup));
            nameInput.startup();

            // Email Field
            var emailGroup = domConstruct.create("div", { className: "mb-3" }, form.domNode);
            domConstruct.create("label", {
                className: "form-label fw-semibold text-secondary",
                innerHTML: Properties.get("label.email", "Email Address")
            }, emailGroup);
            var emailInput = new ValidationTextBox({
                name: "email",
                required: true,
                trim: true,
                regExp: Properties.get("regex.email"),
                invalidMessage: Properties.get("val.email.invalid"),
                placeHolder: "student@example.com",
                style: "width: 100%;"
            }, domConstruct.create("input", {}, emailGroup));
            emailInput.startup();

            // Password Field
            var pwdGroup = domConstruct.create("div", { className: "mb-3" }, form.domNode);
            domConstruct.create("label", {
                className: "form-label fw-semibold text-secondary",
                innerHTML: Properties.get("label.password", "Password")
            }, pwdGroup);
            var pwdInput = new ValidationTextBox({
                name: "password",
                type: "password",
                required: true,
                trim: true,
                regExp: Properties.get("regex.password"),
                invalidMessage: Properties.get("val.password.invalid"),
                placeHolder: "Min 8 chars, 1 uppercase, 1 lowercase, 1 number",
                style: "width: 100%;"
            }, domConstruct.create("input", {}, pwdGroup));
            pwdInput.startup();

            // Confirm Password Field
            var cpwdGroup = domConstruct.create("div", { className: "mb-4" }, form.domNode);
            domConstruct.create("label", {
                className: "form-label fw-semibold text-secondary",
                innerHTML: Properties.get("label.confirmPassword", "Confirm Password")
            }, cpwdGroup);
            var cpwdInput = new ValidationTextBox({
                name: "confirmPassword",
                type: "password",
                required: true,
                trim: true,
                validator: function (value) {
                    return value && value === pwdInput.get("value");
                },
                invalidMessage: Properties.get("val.password.mismatch"),
                placeHolder: "Re-enter your password",
                style: "width: 100%;"
            }, domConstruct.create("input", {}, cpwdGroup));
            cpwdInput.startup();

            // Submit Button
            var submitBtn = new Button({
                label: Properties.get("auth.signup.btn", "Register Now"),
                class: "btn btn-primary w-100 py-2 fw-bold shadow-sm",
                onClick: function () {
                    if (!form.validate()) {
                        Logger.warn("SignupWidget", "Client-side validation failed for registration form");
                        return;
                    }
                    var payload = {
                        name: nameInput.get("value"),
                        email: emailInput.get("value"),
                        password: pwdInput.get("value")
                    };
                    Logger.info("SignupWidget", "Submitting registration for " + payload.email);
                    submitBtn.set("disabled", true);
                    submitBtn.set("label", "Registering...");
                    onSubmit(payload).then(function () {
                        form.reset();
                    }).finally(function () {
                        submitBtn.set("disabled", false);
                        submitBtn.set("label", Properties.get("auth.signup.btn", "Register Now"));
                    });
                }
            }, domConstruct.create("button", {}, form.domNode));
            submitBtn.startup();

            form.startup();
        }
    };
});

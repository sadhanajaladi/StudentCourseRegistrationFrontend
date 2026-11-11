
define([
    "dojo/dom-construct",
    "dijit/form/Form",
    "dijit/form/ValidationTextBox",
    "dijit/form/Button",
    "dijit/layout/ContentPane",
    "app/services/Properties",
    "app/services/Logger"
], function (
    domConstruct,
    Form,
    ValidationTextBox,
    Button,
    ContentPane,
    Properties,
    Logger
) {
    return {
        render: function (parent, onSubmit) {

            // Main login container
            var container = new ContentPane({
                className: "container min-vh-100 d-flex align-items-center justify-content-center py-5"
            });

            container.placeAt(parent);

            // Bootstrap card
            var card = domConstruct.create("div", {
                className: "card shadow-lg border-0",
                style: "max-width:440px;width:100%;border-radius:12px;"
            }, container.domNode);

            var cardBody = domConstruct.create("div", {
                className: "card-body p-4 p-md-5"
            }, card);

            // Login heading
            domConstruct.create("h2", {
                innerHTML: Properties.get("auth.login.title", "Student Portal"),
                className: "text-center fw-bold text-primary mb-1"
            }, cardBody);

            domConstruct.create("p", {
                innerHTML: Properties.get("auth.login.subtitle", "Sign in to your account"),
                className: "text-center text-muted mb-4"
            }, cardBody);

            // Notification area
            domConstruct.create("div", {
                id: "authNotice",
                className: "mb-3"
            }, cardBody);

            // Dijit form
            var form = new Form({
                method: "post"
            });

            form.placeAt(cardBody);

            // Email field
           var emailInput = new ValidationTextBox({
    name: "email",
    required: true,
    trim: true,

    regExp: "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}",

    invalidMessage: "Please enter a valid email address.",
    missingMessage: "Email address is required.",
    placeHolder: "student@example.com",
    style: "width:100%;margin-bottom:15px;"
});

emailInput.placeAt(form.containerNode);
emailInput.startup();

            emailInput.placeAt(form.containerNode);

            // Password field
            var passwordInput = new ValidationTextBox({
                name: "password",
                type: "password",
                required: true,
                trim: false,
                invalidMessage: Properties.get(
                    "val.required",
                    "Password is required."
                ),
                missingMessage: "Password is required.",
                placeHolder: "Enter your password",
                style: "width:100%;margin-bottom:20px;"
            });

            passwordInput.placeAt(form.containerNode);

            // Submit button
            var submitButton = new Button({
                label: Properties.get("auth.login.btn", "Sign In"),
                type: "button",
                className: "btn btn-primary w-100 py-2 fw-bold",
                onClick: function () {

                    if (!emailInput.isValid() || !passwordInput.isValid()) {
                        emailInput.validate();
                        passwordInput.validate();

                        Logger.warn(
                            "LoginWidget",
                            "Login validation failed"
                        );
                        return;
                    }

                    var email = emailInput.get("value");
                    var password = passwordInput.get("value");

                    submitButton.set("disabled", true);
                    submitButton.set("label", "Signing in...");

                    Logger.info("LoginWidget", "Login submitted: " + email);

                    onSubmit(email, password)
                        .catch(function () {
                            submitButton.set("disabled", false);
                            submitButton.set(
                                "label",
                                Properties.get("auth.login.btn", "Sign In")
                            );
                        });
                }
            });

            submitButton.placeAt(form.containerNode);

            // Registration link
            domConstruct.create("p", {
                className: "text-center text-muted mt-4",
                innerHTML:
                    Properties.get(
                        "auth.login.signup_prompt",
                        "Don't have an account?"
                    ) +
                    ' <a href="#/register" class="fw-bold text-decoration-none">' +
                    Properties.get("auth.login.signup_link", "Register here") +
                    '</a>'
            }, cardBody);

            // Start Dijit widgets
            emailInput.startup();
            passwordInput.startup();
            submitButton.startup();
            form.startup();
            container.startup();
        }
    };
});

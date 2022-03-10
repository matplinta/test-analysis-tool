String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

function AuthenticationController() {
    var that = this;
    this.dialog = new AuthenticationDialog(this);
    this.model = new Authenticator(this);
    this.loginButton = '#login-button';
    this.logoutButton = '#logout-button';
    this.username = 'undefined';

    // Events
    this.onChange = null;

    var addButtonEvents = function () {
        if (AuthenticationController.isUserLoggedIn()) {
            $(that.logoutButton).on("click", function () {
                that.model.logout();
            });
        } else {
            $(that.loginButton).on("click", function () {
                that.dialog.show();
            })
        }
    };

    addButtonEvents();



    this.refreshButtons = function () {
        addButtonEvents();
    }
}
AuthenticationController.isUserLoggedIn = function () {
    return $('#login-button').length === 0
};

AuthenticationController.showErrorMsg = function () {
    swal(
        "Authentication error",
        "You have to be logged in.",
        "error"
    )
};

function Authenticator(parent) {
    this.parent = parent;
    var that = this;

    var logoutDOM = '<a id="login-button" title="Login using LDAP credentials">Login</a>';
    var loginDOM = function () {
        return '<a id="logout-button" title="Logout from the service">Logout</a>' +
            '<h3 class="float_right" style="cursor: context-menu">Logged as: ' + that.parent.username + '</h3>';
    };
    var showErrorMsg = function (msg) {
        /** @namespace msg.msg */
        swal(
            msg.status.capitalizeFirstLetter(),
            msg.msg,
            "error"
        );
    };
    var showSuccessMag = function (type) {
        var headers = {
            "login": ["Logged in!", "You are logged in."],
            "logout": ["Logged out!", "You are logged out."]
        };
        swal({
            "title": headers[type][0],
            "text": headers[type][1],
            "type": "success",
            "timer": 2000
        },
        function () {
            swal.close();
            if (typeof(that.parent.onChange) === "function") {
                that.parent.onChange(type);
            }
        });
    };
    var handleQuerySuccess = function (msg, flag) {
        if (typeof msg.status !== "undefined") {
            if (msg.status == "success") {
                changeDOM(flag);
                showSuccessMag(flag);
                that.parent.refreshButtons();
                return true;
            }
            showErrorMsg(msg);
            return false;
        }
    };
    var changeDOM = function (key) {
        var $container = $('#authentication-dom-container');
        if (key == 'logout') {
            $container.html(logoutDOM)
        } else if (key == 'login') {
            $container.html(loginDOM())
        } else {
            throw 'Wrong key specified!'
        }
    };
    var queryLogout = function () {
        $.ajax('/authentication/logout/', {
            type: 'POST',
            data: {
                'csrfmiddlewaretoken': new AJAX().getCSRFToken()
            },
            dataType: 'json',
            success: function (msg) {
                handleQuerySuccess(msg, 'logout')
            },
            error: function (msg) {
                console.log(msg)
                swal(msg, "error")
            }
        })
    };
    var queryLogin = function (credentials) {
        $.ajax('/authentication/login/', {
            type: 'POST',
            data: {
                'credentials': credentials,
                'csrfmiddlewaretoken': AJAX.token
            },
            dataType: 'json',
            success: function (msg) {
                if (handleQuerySuccess(msg, 'login')) {
                    that.parent.dialog.hide();
                }
            },
            error: function (data) {
                swal(data, "error")
            }
        })
    };
    return {
        logout: function () {
            swal({
                    title: "Are you sure?",
                    text: "You will be logged out.",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Log out!",
                    closeOnConfirm: false },
                function () {
                    queryLogout();
                });
        },
        login: function (credentials) {
            queryLogin(credentials);
        }
    }
}

function AuthenticationDialog(parent) {
    var that = this;
    this.parent = parent;
    this.$form = $('#login-form');
    this.$confirmButton = $('#confirm-login');
    this.$cancelButton = $('#cancel-login');
    this.errMsg = "This field is required";
    this.isVisible = false;

    var getCredentials = function () {
        var username = $('#login_username').val();
        var password = $('#login_password').val();
        var remember = $('#login_remember').is(':checked');
        that.parent.username = username;
        return {
            "username": username,
            "password": password,
            "remember": remember
        }
    };

    var bindEvents = function () {
        that.$cancelButton.on("click", function () {
            that.hide()
        });
        that.$confirmButton.on("click", function () {
            var credentials = JSON.stringify(getCredentials());
            that.parent.model.login(credentials);
        });
        that.$form.on("submit", function(e) {
            console.log("submit");
            e.preventDefault();
        });
    };

    bindEvents();

    this.hide = function () {
        if (that.isVisible) {
            that.$form.animate({
                "top": "-50%"
            }, 1000);
            that.isVisible = false;
        }
    };
    this.show = function () {
        if (!that.isVisible) {
            that.$form.animate({
                "top": "50%"
            }, 1000);
            that.isVisible = true;
        }
    };
}

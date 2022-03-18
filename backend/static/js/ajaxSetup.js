/**
 * Created by gontarz on 2014-09-12.
 */

AJAX = function (token) {
    AJAX.token = token;
};

AJAX.prototype = {
    getCSRFToken: function () {
        return this.getCookie('csrftoken');
    },
    getCookie: function(name) {
		var cookieValue = null;
		if (document.cookie && document.cookie != '') {
			var cookies = document.cookie.split(';');
			for (var i = 0; i < cookies.length; i++) {
				var cookie = jQuery.trim(cookies[i]);
				if (cookie.substring(0, name.length + 1) == (name + '=')) {
					cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
					break;
				}
			}
		}
		return cookieValue;
	},
    sameOrigin: function (url) {
		// test that a given url is a same-origin URL
		// url could be relative or scheme relative or absolute
		var host = document.location.host; // host + port
		var protocol = document.location.protocol;
		var sr_origin = '//' + host;
		var origin = protocol + sr_origin;
		// Allow absolute or scheme relative URLs to same origin
		return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
				(url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
			// or any other URL that isn't scheme relative or absolute i.e relative.
				!(/^(\/\/|http:|https:).*/.test(url));
	},
    csrfSafeMethod: function (method) {
		// these HTTP methods do not require CSRF protection
		return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method))
	},
    setup: function () {
        var obj = this;
        $.ajaxSetup({
            crossDomain: false,
            beforeSend: function (xhr, settings) {
                if (!obj.csrfSafeMethod(settings.type)) {
                    // Send the token to same-origin, relative URLs only.
                    // Send the token only if the method warrants CSRF protection
                    // Using the CSRFToken value acquired earlier
                    xhr.setRequestHeader("X-CSRFToken", obj.getCookie('csrftoken'));
                }
            }
        });
        this.addEvents();
    },
    addEvents: function () {
        $(document).on({
            ajaxStart: function() { $("body").addClass("loading");},
            ajaxStop: function() { $("body").removeClass("loading");}
        });
    }
};

AjaxResponse = function () {};
AjaxResponse.prototype = {
    success: function (ajaxResponse) {
        infoDialog.clearMsgBox();
        this.handleAjaxResponse(ajaxResponse);
        infoDialog.open()
    },
    handleAjaxResponse: function (response) {
        var app_errors = response.app_errors;
        if (typeof app_errors !== 'undefined') {
            infoDialog.addError(app_errors);
        } else {
            this.addMessages(response);
        }
    },
    addMessages: function (msg) {
        var confirmations = typeof msg.responseJSON !== 'undefined' ? msg.responseJSON['confirmations'] : msg.confirmations;
        var errors = typeof msg.responseJSON !== 'undefined' ? msg.responseJSON['errors'] : msg.error;
        if (this.checkUserRights(confirmations, errors)) {
            this.addConfirmationMessages(confirmations);
            this.addErrorMessages(errors);
            TableHandler.removeRowSelections();
        }
    },
    checkUserRights: function (conf, err) {
        if (typeof conf === 'undefined' && typeof err === 'undefined') {
            infoDialog.addError('You are no allowed to create a new test execution links.');
            return false;
        }
        return true;
    },
    addConfirmationMessages: function (conf) {
        if (typeof  conf !== 'undefined') {
            if (typeof conf === 'string') {
                return infoDialog.addConf(conf);
            }
            for (var i = 0; i < conf.length; ++i) {
                var confirmation = conf[i];
                infoDialog.addConf(confirmation);
            }
        }
    },
    addErrorMessages: function (err) {
        if (typeof err !== 'undefined') {
            if (typeof err === 'string') {
                return infoDialog.addError(err);
            }
            for (var i = 0; i < err.length; ++i) {
                var error = err[i];
                infoDialog.addError(error);
            }
        }
    }
};

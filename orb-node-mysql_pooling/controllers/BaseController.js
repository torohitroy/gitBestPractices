var _ = require("underscore");

module.exports = {
    name: "baseController",
    extend: function (child) {
        return _.extend({}, this, child);
    },
    createResponse: function (data, status) {
        var ob = {};
        if (!_generic.isEmpty(data))
            ob.data = data;
        ob.status = status;
        return ob;
    },

    beforeRender: function (req, res, next) {
        console.log('running beforeRender ...\n');
        next();
    },

    validateUser: function (req, res, next) {
        var self = this;
        var UserSessionModel = new (require("../models/UserSessionModel.js"));
        var userid = req.headers.userid;
        var token = req.headers.token;
        if (userid == undefined) {
            res.status(401).send(self.createResponse({}, {
                success: false,
                message: "Userid is required"
            }));
        } else if (token == undefined) {
            res.status(401).send(self.createResponse({}, {
                success: false,
                message: "Token is required"
            }));
        } else {

            UserSessionModel.validateUser(userid, token, function (err, result) {
                if (err) {
                    res.status(401).send(self.createResponse({}, {
                        success: false,
                        message: "Something went wrong, please try later!"
                    }));
                } else {
                    if (result.length > 0) {
                        console.log("valid user");
                        next();
                    } else {
                        res.status(401).send(self.createResponse({}, {
                            success: false,
                            message: "Userid or token is invalid"
                        }));
                    }
                }
            });
        }
    }
}
var Model = require("./BaseModel")
    , md5 = require('md5')
    , model = new Model()
    , crypto = require('crypto');
var UserSessionModel = model.extend({
	
    // validations
    validate: function (data, res, rules) {
        console.log(data + "this is")
        if (rules.user_id) {
            data.checkBody('user_id', 'User id is required').notEmpty();
        }
        if (rules.device_type) {
            data.checkBody('device_type', 'Device Type is required').notEmpty();
        }

        var errors = data.validationErrors();
        console.log("validate");
        if (errors !== false) {

            res.status(400).send(this.createResponse({}, {
                success: false,
                message: errors[0].msg
            }));
            return false;
        }
        return true;
    },

    validateUser: function (userId, token, callback) {

        var sql = "SELECT * FROM  `user_sessions` where user_id = ? and token = ?";
        model.db.getConnection(function (err, connection) {
            connection.query(sql, [userId, token], function (err, result) {
                connection.release();
                callback(err, result);
            });
        });
    },

    createSessionToken: function (data, callback) {
        this.checkIfSessionExists(data.user_id, function (err, results) {
            if (err) {
                callback(err);
                return false;
                // Generate and insert token in user_sessions table
            } else {
                if (results.length) {
                    callback(err, results, results[0].token);
                } else {
                    var d = new Date();
                    var timeStampMilliSeconds = d.getTime();
                    var token = md5(data.id + timeStampMilliSeconds + crypto.randomBytes(32).toString('hex'));
                    var post = {
                        user_id: data.user_id,
                        token: md5(token),
                        device_type: data.device_type
                    };
                    model.db.getConnection(function (err, connection) {
                        if (err) {
                            callback(err);
                            return false;
                        }
                        connection.query('INSERT INTO user_sessions SET ?', post, function (err, result) {
                            connection.release();
                            callback(err, result, post.token);
                        });
                    });
                }
            }
        });
    },

    checkIfSessionExists: function (user_id, callback) {

        var sql = "SELECT * FROM ?? WHERE ?? = ?";
        var fieldAndValue = ['user_sessions', 'user_id', user_id];
        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            sql = connection.format(sql, fieldAndValue);
            connection.query(sql, function (err, results) {
                connection.release();
                callback(err, results);

            });
        });
    },

    removeSessionToken: function (data, callback) {
        var sql = "DELETE FROM ?? WHERE ?? = ?";
        var fieldAndValue = ['user_sessions', 'user_id', data.userid];
        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
                return false;
            }

            sql = connection.format(sql, fieldAndValue);
            connection.query(sql, function (err, results) {
                connection.release();
                callback(err, results);
            });
        })
    },

    getToken: function (userid, callback) {
        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            connection.query('SELECT * from user_sessions where user_id = ?', [userid], function (err, result) {
                connection.release();
                callback(err, result);
            });
        });
    },

    checkIdandToken: function (data, callback) {
        var sql = "SELECT * FROM ?? WHERE ?? = ? AND ?? = ?";
        var fieldAndValue = ['user_sessions', 'user_id', data.userid, 'token', md5(data.token)];

        sql = this.db.format(sql, fieldAndValue);

        this.db.query(sql, function (err, results) {
            if (err) {
                _generic.res.status(400).send(self.createResponse({}, {
                    success: false,
                    message: err.message
                }));
                return false;
            }

            callback(err, results);
        });
    },

    getDeviceId: function (data, callback) {
        var sql = "SELECT device_type FROM ?? WHERE ?? = ?";
        var fieldAndValue = ['user_sessions', 'user_id', data.userid];

        sql = this.db.format(sql, fieldAndValue);

        var self = this;
        this.db.query(sql, function (err, results) {
            if (err) {
                _generic.res.status(400).send(self.createResponse({}, {
                    success: false,
                    message: err.message
                }));
                return false;
            }

            callback(err, results);
        });
    }
});

module.exports = UserSessionModel;

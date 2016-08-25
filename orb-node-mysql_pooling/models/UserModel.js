var AWS = require('aws-sdk');
var Model = require("./BaseModel");
var md5 = require('md5');
var config = require('../config')();
var fs = require('fs');
var pool = require('../config/mysql_pool');
//var s3 = new AWS.S3();
var model = new Model();

var UserModel = model
        .extend({
    // validations
    validate: function(data, res, rules) {
        if (rules.name) {
            data.checkBody('name', 'Name is required').notEmpty();
        }
        if (rules.email) {
            data.checkBody('email', 'Please enter your email address').notEmpty();
            data.checkBody('email', 'Please enter a valid email address').isEmail();
        }
        if (rules.password) {
            data.checkBody('password', 'Please enter your password').notEmpty();
        }
        if (rules.device_type) {
            data.checkBody('device_type', 'Device Type is required')
                    .notEmpty();
        }
        if (rules.user_status) {
            data.checkBody('user_status', 'User Status is required').notEmpty();
            data.checkBody('user_status', '2 to 30 characters required').len(2, 30);
        }
        if (rules.profile_pic) {
            data.checkBody('profile_pic', 'Image is required').notEmpty();
        }
        if (rules.registration_type) {
            data.checkBody('registration_type', 'Registration type is required').notEmpty();
        }
        if (rules.fb_token) {
            data.checkBody('fb_token', 'Facebook token is required').notEmpty();
        }
        if (rules.device_token) {
            data.checkBody('device_token', 'Device token is required').notEmpty();
        }
        if (rules.fb_id) {
            data.checkBody('fb_id', 'Facebook Id is required').notEmpty();
        }


        var errors = data.validationErrors();
        if (errors !== false) {
            res.status(400).send(this.createResponse({}, {
                success: false,
                message: errors[0].msg

            }));
            return false;
        }
        return true;
    },
    isFbIdAvailable: function(data, callback) {
        model.db.getConnection(function(err, connection) {
            if (err) {
                callback(err);
            }
            connection.query('SELECT * from users where facebook_id = ? or email= ?', [data.id, data.email_id], function(err, result) {
                connection.release();
                callback(err, result);
            });
        });
    },
    enableActiveVerifiedUser: function(userid, callback) {
        //console.log("UNDER model ", userid);
        model.db.getConnection(function(err, connection) {
            if (err) {
                callback(err);
            }
            connection.query('UPDATE users SET isActive = ? where id = ?', [1, userid], function(err, result, fields) {
                connection.release();
                callback(err, result);
            });
        })
    },
    enableActive: function(token, callback) {
        console.log("TOKEN => " + token);
        model.db.getConnection(function(err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            connection.query('SELECT email, pass_token, isActive FROM users where confirmation_token = ?', [token], function(err, results, fields) {
                connection.query('UPDATE users SET isActive = ?,confirmation_token = null where confirmation_token = ?', [1, token], function(err, result, fields) {
                    connection.release();
                    callback(err, results, fields);
                });
            });
        });

    },
    getUserByConfirmToken: function(token, callback) {
        model.db.getConnection(function(err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            connection.query('SELECT id FROM users where confirmation_token = ?', [token], function(err, result, fields) {
                connection.release();
                callback(err, result, fields);
            });
        });
    },
    getUserId: function(email, callback) {
        var self = this;
        var query = self.db.query('SELECT id FROM users where email = ?', [email], function(err, result, fields) {
            callback(err, result, fields);
        });
    },
    getEmail: function(email, callback) {
        model.db.getConnection(function(err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            connection.query('SELECT * FROM users where email = ?', [email], function(err, result) {
                connection.release();
                callback(err, result);
            });

        })
    },
    reset_password: function(data, callback) {

        //var self = this;
        model.db.getConnection(function(err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            connection.query('UPDATE users SET password = ?, reset_password_token = ? WHERE id = ? && reset_password_token = ?', [data.password, null, data.id, data.reset_password_token], function(err, result, fields) {
                connection.release();
                callback(err, result);
            });
        });
    },
    canResetPassword: function(data, callback) {
        model.db.getConnection(function(err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            connection.query('SELECT count(*) as isActiveLink from users where id = ? && reset_password_token = ?', [data[0], data[1]], function(err, result) {
                connection.release();
                callback(err, result);
            });
        });
    },
    setPassToken: function(user_id, token, callback) {
        model.db.getConnection(function(err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            var sql = 'UPDATE users set reset_password_token= ? where id = ?';
            var fieldAndValue = [token, user_id];
            sql = connection.format(sql, fieldAndValue);
            console.log(sql);
            connection.query(sql, function(err, result) {
                connection.release();
                callback(err, result);
            });
        });
    },
    makeFriendTotheirSelf: function(user_id, email) {
        model.db.getConnection(function(err, connection) {
            connection.query('INSERT into friend_requests_latest (receiver_id, receiver_email, sender_id, request_status) values (?, ?, ?, ?)', [user_id, email, user_id, 'A'], function(err, result) {
                if (err) {
                    connection.release();
                } else {
                    connection.query('UPDATE friend_requests_latest set receiver_id = ? where receiver_email = ?', [user_id, email], function(err, result1) {
                        connection.release();
                    });
                }
            });
        });
    },
    register: function(data, callback) {
        var d = new Date();
        var timeStampMilliSeconds = d.getTime();
        var userid = md5(timeStampMilliSeconds);
        var password = md5(data.password);
        var now = new Date();
        var current_time = new Date((now.getTime() - ((new Date()).getTimezoneOffset() * 60000))).toISOString().slice(0, 19).replace('T', ' ');

        /**** Cut name to first and last name ****/
        var name = data.name.split(" "), firstname, lastname;
        if (name.length === 1) {
            firstname = name.shift();
            lastname = " ";
        } else {
            firstname = name.shift();
            lastname = name.join(" ");
        }
        var pass_token = md5(timeStampMilliSeconds + data.password);
        var post = {
            id: userid,
            username: data.name,
            firstname: firstname,
            lastname: lastname,
            password: password,
            device_type: data.device_type,
            email: data.email,
            confirmation_token: data.token,
            isActive: 0,
            registration_type: data.registration_type,
            device_token: data.device_token,
            created_at: current_time,
            pass_token: pass_token
        };
        /***** if defined pass email to post object to db insertion ****/

        //this.getThisField({ field: 'id', prop: 'email', value: data.email }, function (err, user) {

        model.db.getConnection(function(err, connection) {
            if (err) {
                callback(err);
                return false;

            }
            connection.query('INSERT INTO users SET ?', post,
                    function(err, result) {

                        // set data to be sent with result variable
                        result.dataSet = {};
                        result.dataSet.user_id = userid;
                        result.dataSet.pass_token = pass_token;
                        connection.release();
                        callback(err, result);
                    });
        });
    },
    registerfacebook: function(data, callback) {

        //var self = this;
        var d = new Date();
        var timeStampMilliSeconds = d.getTime();
        var userid = md5(timeStampMilliSeconds);
        console.log("userid in facebook" + userid);
        var now = new Date();
        var current_time = new Date((now.getTime() - ((new Date()).getTimezoneOffset() * 60000))).toISOString().slice(0, 19).replace('T', ' ');

        var name = data.name.split(" "), first_name, last_name;
        if (name.length === 1) {
            first_name = name.shift();
            last_name = " ";
        } else {
            first_name = name.shift();
            last_name = name.join(" ");
        }
        console.log("FB => " + data.fb_id);
        console.log("FB TOKEN => " + data.fb_token);
        var pass_token = md5(timeStampMilliSeconds + data.fb_id);
        var post = {
            id: userid,
            firstname: first_name,
            lastname: last_name,
            username: data.name,
            device_type: data.device_type,
            email: data.email,
            confirmation_token: data.token,
            profile_pic: data.user_pic,
            facebook_id: data.fb_id,
            fb_access_token: data.fb_token,
            registration_type: data.registration_type,
            device_token: data.device_token,
            created_at: current_time
        };

        this.getThisField({field: 'id', prop: 'email', value: data.email}, function(err, user) {
            if (user.length === 0) {
                post.pass_token = pass_token;
                model.db.getConnection(function(err, connection) {
                    connection.query('INSERT INTO users SET ?', post, function(err, result, fields) {

                        // set data to be sent with result variable
                        result.dataSet = {};
                        result.dataSet.user_id = userid;
                        result.dataSet.pass_token = post.pass_token;
                        connection.release();
                        callback(err, result);
                    });
                });

            } else {
                delete post.id;
                post.pass_token = null;
                model.db.getConnection(function(err, connection) {
                    if (err) {
                        callback(err);
                    }
                    connection.query("UPDATE users SET ? WHERE id='" + user[0].id + "'", post, function(err, result) {

                        // set data to be sent with result variable
                        result.dataSet = {};
                        result.dataSet.user_id = user[0].id;
                        result.dataSet.pass_token = post.pass_token;
                        connection.release();
                        callback(err, result);
                    });
                });
            }
        });
    },
    isActive: function(email, callback) {
        model.db.getConnection(function(err, connection) {
            if (err) {
                callback(err);
            } else {
                connection.query("SELECT isActive FROM users WHERE email = ?", [email], function(err, result) {
                    connection.release();
                    callback(err, result);
                });

            }
        })
    },
    getThisField: function(data, callback) {

        model.db.getConnection(function(err, connection) {
            if (err) {
                callback(err);
            }
            var sql = "SELECT ?? FROM ?? WHERE ?? = ? ";
            var fieldAndValue = [data.field, 'users', data.prop, data.value];
            sql = connection.format(sql, fieldAndValue);
            connection.query(sql, function(err, result) {
                connection.release();
                callback(err, result);
            });
        });
    },
    /**
     * Method for updating user status from first time login to old user.
     */
    updateUserLogin: function(data, callback) {
        model.db.getConnection(function(err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            var sql = "UPDATE users SET isFirstLogin = 1, device_token = ? , device_type = ?, pass_token = null, isActive = 1 where email = ?";
            var fieldAndValue = [data.device_token, data.device_type, data.email];
            sql = connection.format(sql, fieldAndValue);
            connection.query(sql, function(err, result) {
                connection.release();
                callback(err, result);
            });
        });
    },
    checkUser: function(data, callback) {

        model.db.getConnection(function(err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            connection.query("SELECT * FROM users where email = ?", [data.email], function(err, result) {
                connection.release();
                callback(err, result);
            });
        });
    },
    showusername: function(data, callback) {
        model.db.getConnection(function(err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            var sql = "SELECT username FROM ?? WHERE ?? = ?";
            var fieldAndValue = ['users', 'id', data];
            sql = connection.format(sql, fieldAndValue);

            connection.query(sql, function(err, results, fields) {
                connection.release();
                callback(err, results, fields);
            });
        });
    },
    checkIfUserRegistered: function(data, callback) {

        var sql = "SELECT * FROM ?? WHERE ?? = ?";
        var fieldAndValue = ['users', 'email', data.email];
        model.db.getConnection(function(err, connection) {
            sql = connection.format(sql, fieldAndValue);

            connection.query(sql, function(err, results) {

                connection.release();
                callback(err, results);
            });
        });
    },
    checkIfUserEmailRegisteredAsOrb: function(data, callback) {

        var sql = "SELECT * FROM ?? WHERE ?? = ? AND ?? = ?";
        var fieldAndValue = ['users', 'email', data.email, 'registration_type', 'O'];
        sql = this.db.format(sql, fieldAndValue);
        console.log(sql);
        var self = this;
        this.db.query(sql, function(err, results, fields) {
            if (err) {
                _generic.res.status(400).send(
                        self.createResponse({}, {
                    success: false,
                    message: err.message
                }));
                return false;
            }
            callback(err, results, fields);
        });
    },
    updateSettings: function(data, callback) {
        var updateData = {}
        if (data.profile_pic) {
            this.uploadUserImage(data, function(err, path) {
                if (err) {
                    callback(err);
                    return false;
                }
                delete data.profile_pic;
                updateData.profile_pic = path;
                if (data.user_status) {
                    updateData.user_status = data.user_status;
                }
                delete data.user_status;
                model.db.getConnection(function(err, connection) {
                    connection.query('UPDATE users set ? where ?', [updateData, data], function(err, result) {
                        connection.release();
                        callback(err, result);
                    });
                });
            });
        } else {
            updateData.user_status = data.user_status;
            delete data.user_status;
            model.db.getConnection(function(err, connection) {
                connection.query('UPDATE users set ? where ?', [updateData, data], function(err, result) {
                    connection.release();
                    callback(err, result);
                });
            });
        }
    },
    getUserDetails: function(data, callback) {
        model.db.getConnection(function(err, connection) {
            var sql = "SELECT username,firstname,user_status,email,profile_pic FROM users WHERE id = ?";
            var fieldAndValue = [data.userid];
            sql = connection.format(sql, fieldAndValue);

            connection.query(sql, function(err, results) {
                connection.release();
                callback(err, results);
            });
        });
    },
    saveImageToDb: function(data, callback) {

        model.db.getConnection(function(err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            var sql = "UPDATE users SET profile_pic = ? WHERE id = ?";
            var fieldAndValue = [data.profile_pic, data.userid];
            sql = connection.format(sql, fieldAndValue);
            connection.query(sql, function(err, results, fields) {
                connection.release();
                callback(err, results, fields);
            });
        })
    },
    uploadUserImage: function(data, callback) {


        var AWS = require('aws-sdk');
        var accessKeyId = config.s3.S3_KEY;
        var secretAccessKey = config.s3.S3_SECRET;
        AWS.config.update({
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
            apiVersion: {
                s3: "2006-03-01"
            }
        });
        AWS.config.region = "us-east-1";
        var s3 = new AWS.S3();
        var image = "user_" + Math.floor(Date.now() / 1000);
        var path = '';

        var bitmap = new Buffer(data.profile_pic, 'base64');
        fs.writeFile(image, bitmap, function(err) {
            if (err) {

                callback(err);
            } else {
                var bodyStream = fs.createReadStream(image);
                var params = {Bucket: 'orbmitranscoder', Key: "users/" + image, Body: bodyStream, ACL: 'public-read'};
                s3.putObject(params, function(err, dataa) {
                    path = "http://orbmitranscoder.s3.amazonaws.com/users/" + image;
                    fs.unlink(image, function(err) {
                        if (err) {
                            console.log(err);
                        }
                        console.log("deleted file");
                    });
                    callback(err, path);
                });
            }
        });
    },
    logout: function(user_id, callback) {
        model.db.getConnection(function(err, connection) {
            if (err) {
                callback(err);
                return false;
            } else {
                connection.query("DELETE from user_sessions where user_id = ?", [user_id], function(err, result) {
                    if (err) {
                        callback(err);
                        return false;
                    } else {
                        if (result.affectedRows) {
                            connection.query("UPDATE users set device_token = ? where id = ? ", [null, user_id], function(err, result) {
                                if (err) {
                                    callback(err);
                                    return false;
                                }
                                connection.release();
                                callback(err, result);
                            });
                        } else {
                            var error = {message: 'No user session found'};
                            callback(error);
                            return false;
                        }
                    }
                });
            }
        });
    }
});
module.exports = UserModel;



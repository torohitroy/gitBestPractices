var Model = require("./BaseModel");
var model = new Model();
var InvitationModel = model.extend({
    validate: function (data, res, rules) {

        if (rules.email) {
            data.checkBody('email', 'Email is required').notEmpty();
            data.checkBody('email', 'Invalid Email').isEmail();
        }
        if (rules.friend_id) {
            data.checkBody('friend_id', 'Friend Id is required').notEmpty();
        }
        if (rules.request_status) {
            data.checkBody('request_status', 'Request status is required').notEmpty();
        }
        if (rules.contact_method) {
            data.checkBody('contact_method', 'Contact method is required').notEmpty();
        }

        var errors = data.validationErrors();
        //console.log("-=-=-" + data.validationErrors());
        if (errors !== false) {
            res.status(400).send(this.createResponse({}, {
                success: false,
                message: errors[0].msg

            }));
            return false;
        }
        return true;
    },

    getPendingRequest: function (data, callback) {

        var sql = "SELECT * FROM ?? WHERE (?? = ? && ?? = ?) || ( ?? = ? && ?? = ? )";
        var fieldAndValue = ['friend_requests_latest', 'user_id', data.userid, 'request_status', 'P', 'email', data.email, 'request_status', 'P'];
        model.db.getConnection(function (err, connection) {
            sql = connection.format(sql, fieldAndValue);
            connection.query(sql, function (err, results) {
                connection.release();
                callback(err, results);

            });
        });
    },

    getContacts: function (data, callback) {


        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
            }
            var sql = "SELECT * FROM (SELECT f.id,f.receiver_id,f.request_status,u.username,u.profile_pic,ul.id as loc_id,ul.location FROM ?? AS f INNER JOIN users AS u ON u.email = f.receiver_email LEFT JOIN ?? AS ul ON f.receiver_id=ul.user_id WHERE f.sender_id = ? && request_status='A' UNION SELECT f.id,f.sender_id,f.request_status,f.receiver_id,u.username,u.profile_pic,ul.id as loc_id,ul.location FROM  `friend_requests_latest` AS f INNER JOIN users AS u ON u.id = f.sender_id LEFT JOIN user_locations AS ul ON f.sender_id=ul.user_id WHERE f.receiver_email = ? && request_status='A') as a "
            var fieldAndValue = ['friend_requests_latest', 'user_locations', data.userid, data.email];
            sql = connection.format(sql, fieldAndValue);
            connection.query(sql, function (err, results) {
                connection.release();
                callback(err, results);
            });
        });
    },
    getFriendsLocation: function (data, callback) {

        var sql = "SELECT lacation,address from ?? where user_id=?";
        var fieldAndValue = ['user_locations', data.user_id];
        sql = this.db.format(sql, fieldAndValue);
        var self = this;
        console.log(sql);
        this.db.query(sql, function (err, results, fields) {
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

    AcceptOrDenyRequest: function (data, callback) {
        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
                return false;
            }

            var sql1 = "UPDATE friend_requests_latest SET ?? = ? WHERE ?? = ? && ?? = ?";

            var fieldAndValue = ['request_status', 'A', 'id', data.friend_id, 'receiver_id', data.userid];
            sql1 = connection.format(sql1, fieldAndValue);

            connection.query(sql1, function (err, results, fields) {
                //, [data.userid, data.])
                connection.release();
                callback(err, results, fields);
            });
        });
    },

    alreadyFriends: function (data, callback) {
        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            var sql = "SELECT * FROM ?? WHERE ?? = ? && ?? = ? && ?? = ? || ??=? && ??=? && ??=? ";
            var fieldAndValue = ['friend_requests_latest', 'user_id', data.userid, 'email', data.email, 'request_status', 'A', 'user_id', data.id, 'email', data.user_email, 'request_status', 'A'];
            sql = connection.format(sql, fieldAndValue);
            connection.query(sql, function (err, results, fields) {
                connection.release();
                callback(err, results, fields);
            });
        });
    },
    requestAlreadySent: function (data, callback) {

        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
            }
            var sql = "SELECT * FROM ?? WHERE ?? = ? && ?? = ? && ?? = ?";
            var fieldAndValue = ['friend_requests_latest', 'sender_id', data.userid, 'receiver_email', data.email, 'request_status', 'P'];
            sql = connection.format(sql, fieldAndValue);
            connection.query(sql, function (err, results, fields) {
                connection.release();
                callback(err, results, fields);
            });
        })

    },
    sameUserNotFriend: function (data, callback) {
        var sql = "SELECT * FROM ?? WHERE (?? = ? && ?? = ?) && ?? = ?";
        var fieldAndValue = ['friend_requests_latest', 'sender_id', data.sender_id, 'receiver_id', data.receiver_id, 'request_status', 'P'];
        sql = this.db.format(sql, fieldAndValue);
        var self = this;
        console.log(sql);
        this.db.query(sql, function (err, results, fields) {
            if (err) {
                _generic.res.status(400).send(self.createResponse({}, {
                    success: false,
                    messgage: err.message
                }));
                return false;
            }
            callback(err, results, fields);
        });

    },
    getThisField: function (data, callback) {
        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
            }
            var sql = "SELECT ?? FROM ?? WHERE ?? = ? ";
            var fieldAndValue = [data.field, 'users', data.prop, data.value];
            sql = connection.format(sql, fieldAndValue);

            connection.query(sql, function (err, results, fields) {
                connection.release();
                callback(err, results);
            });
        });

    },
    fetchSenderId: function (data, callback) {
        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            //console.log("DATA3 => ",data);
            connection.query('SELECT * FROM user_sessions where user_id = ? AND token = ?', [data.sender_id, data.token], function (err, result, fields) {
                connection.release();
                callback(err, result);
            });
        });

    },

    sendInvite: function (data, callback) {
        console.log('testsfsdf');
        model.db.getConnection(function (err, connection) {

            if (err) {
                callback(err);
                return false;
            }
            if (!data.receiver_id) {
                connection.query('DELETE from friend_requests_latest where sender_id = ? && receiver_email = ?', [data.sender_id, data.receiver_email], function (err, result) {
                    connection.query("INSERT INTO friend_requests_latest SET receiver_id = ?,receiver_email = ?,sender_id = ?, request_status = ?", [data.receiver_id, data.receiver_email, data.sender_id, data.request_status], function (err, result) {
                        connection.release();
                        callback(err, result);
                    });
                });
            } else {
                connection.query("INSERT INTO friend_requests_latest SET receiver_id = ?,receiver_email = ?,sender_id = ?, request_status = ?", [data.receiver_id, data.receiver_email, data.sender_id, data.request_status], function (err, result) {
                    connection.release();
                    callback(err, result);
                });
            }
        });
    },
    sendFriendRequest: function (data, callback) {
        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
            }
            // var query = self.db.query("CALL insert_values("+ "'" + data.userid + "'" + " , " + "'" + data.email + "'" + ", " + "'" + data.contact_method + "'"+", @r_id)", function (err, result, fields) {
            connection.query("CALL insert_values('" + data.userid + "','" + data.email + "','" + data.contact_method + "' , @r_id)", function (err, result, fields) {
                connection.release();
                callback(err, result);
            });
        });
    },
    checkAlreadySentRequests: function (data, callback) {

        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            connection.query('DELETE FROM friend_requests_latest where (request_status=?) && ((sender_id = ? AND receiver_id = ?) || (sender_id = ? AND receiver_id = ?))', ['R', data.sender_id, data.receiver_id, data.receiver_id, data.sender_id], function (err, result) {
                connection.query('SELECT * FROM friend_requests_latest where (sender_id = ? AND receiver_id = ?) || (sender_id = ? AND receiver_id = ?) AND (request_status=? or request_status=?)', [data.sender_id, data.receiver_id, data.receiver_id, data.sender_id, 'P', 'A'], function (err, result) {
                    connection.release();
                    callback(err, result);
                });
            });
        });
    },
    getSentFriendRequests: function (data, callback) {
        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
            }
            var sql = "SELECT f.id,u.id as userid,f.receiver_email,u.username,u.profile_pic FROM ?? f left join ?? u on f.receiver_id=u.id WHERE f.sender_id = ? && f.request_status =?";
            var fieldAndValue = ['friend_requests_latest', 'users', data.userid, "P"];
            sql = connection.format(sql, fieldAndValue);
            connection.query(sql, function (err, results) {
                connection.release();
                callback(err, results);
            });
        });
    },

    getReceivedFriendRequests: function (data, callback) {
        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
            }
            var sql = "SELECT f.id,u.id as userid,u.username,u.profile_pic,u.email FROM ?? u inner join ?? f on u.id=f.sender_id WHERE f.receiver_id = ? and f.request_status=?";
            var fieldAndValue = ['users', 'friend_requests_latest', data.userid, 'P'];
            sql = connection.format(sql, fieldAndValue);

            connection.query(sql, function (err, results, fields) {
                connection.release();
                callback(err, results, fields);
            });
        });
    },
    getFriends: function (data, callback) {
        // var sql = "SELECT f.id,u.id as user_id,u.username,u.profile_pic,u.email FROM ?? u inner join ?? f on u.id=f.receiver_id or u.id=f.sender_id WHERE (f.sender_id = ? or f.receiver_id=? ) && u.id!=? && f.request_status = ?";
        // var sql = "SELECT f.id, u.username,f.receiver_id as userid,f.receiver_email as email,u.firstname,u.profile_pic,ul.id as location_id, ul.location \
        // FROM ?? AS f left join ?? AS u on u.id = f.receiver_id left join \
        // ?? AS ul On u.id = ul.user_id where (f.sender_id = ? or f.receiver_id=?) and f.request_status = ?";
        
        model.db.getConnection(function (err, connection) {

            var sql = "select  u.username, u.user_status,u.id as user_id,u.email,u.firstname,u.profile_pic,ul.id as location_id, ul.location from ?? as u left join ?? as ul on ul.user_id=u.id where u.id IN (select `receiver_id` from ?? where `sender_id`=? and `request_status`='A') or u.id IN (select `sender_id` from ?? where `receiver_id`=? and `request_status`='A')"
            var fieldAndValue = ["users", "user_locations", "friend_requests_latest", data.userid, "friend_requests_latest", data.userid, "A"];
            sql = connection.format(sql, fieldAndValue);
            connection.query(sql, function (err, results) {
                //this.db.query.end();
                connection.release();
                callback(err, results);
            });
        });
        //this.db.end();

    },

    deleteRequest: function (data, callback) {
        model.db.getConnection(function (err, connection) {
            var sql = "UPDATE friend_requests_latest SET ?? = ? WHERE ?? = ? && ?? = ?";
            var fieldAndValue = ['request_status', 'R', 'id', data.friend_id, 'receiver_id', data.userid];
            sql = connection.format(sql, fieldAndValue);

            connection.query(sql, function (err, results, fields) {
                connection.release();
                callback(err, results, fields);
            });
        });
    }
});

module.exports = InvitationModel;

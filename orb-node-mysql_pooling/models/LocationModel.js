var Model = require("./BaseModel");
var model = new Model();


var LocationModel = model.extend({

    validate: function (data, res, rules) {

        if (rules.address) {
            data.checkBody('address', 'Address is required').notEmpty();
        }
        if (rules.timekey) {
            data.checkBody('timekey', 'Timekey is required').notEmpty();
        }
        if (rules.location) {
            data.checkBody('location', 'Location is required').notEmpty();
        }
        if (rules.latitude) {
            data.checkBody('latitude', 'Latitude is required').notEmpty();
        }
        if (rules.longitude) {
            data.checkBody('longitude', 'Longitude is required').notEmpty();
        }
        if (rules.start_time) {
            //data.checkBody('start_time', 'Start time is required').optional();
            data.checkBody('start_time', 'Start time is required').notEmpty(); //optional().isInt();
        }
        if (rules.end_time) {
            //data.checkBody('end_time', 'End time is required').optional();
            data.checkBody('end_time', 'End time is required').notEmpty(); //optional().isInt();
        }
        if (rules.location_id) {
            data.checkBody('location_id', 'Location id is required').notEmpty();
            data.checkBody('location_id', 'Location ids must be integer').isInt();
        }

        var errors = data.validationErrors();
        //console.log("validation errors as :"+ errors);
        if (errors !== false) {
            res.status(400).send(this.createResponse({}, {
                success: false,
                message: errors[0].msg
            }));
            return false;
        }
        return true;
    },
    deleteLocation: function (data, callback) {
        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            connection.query('DELETE FROM user_locations WHERE id = "' + data.location_id + '" && user_id = "' + data.userid + '"', function (err, result) {
                connection.release();
                callback(err, result);
            });
        });
    },
    matchNearestLocation: function (data, callback) {
        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            connection.query('SELECT u.device_token, ul.start_time, ul.end_time, ul.id, SQRT(POW(69.1 * (ul.latitude - ?), 2) +POW(69.1 * (? - ul.longitude) * COS(ul.latitude / 57.3), 2)) AS distance FROM user_locations as ul inner join users as u on ul.user_id = u.id where ul.user_id = ? HAVING distance < 0.093 ORDER BY distance limit 1', [data.latitude, data.longitude, data.userid], function (err, result) {
                connection.release();
                callback(err, result);
            });
        });
    },
    

    getLocation: function (data, callback) {

        var fieldAndValue = ['user_locations', 'user_id', data.userid];

        var sql2 = "SELECT id,user_id,address,location,latitude,longitude,start_time,end_time,timekey FROM ?? WHERE ?? = ?";
        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
            }
            sql2 = connection.format(sql2, fieldAndValue);
            connection.query(sql2, function (err, result) {
                connection.release();
                callback(err, result);

            });
        });
    },
    updateLocation: function (data, callback) {

        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
            }
            connection.query('UPDATE user_locations SET ? WHERE id = ? && user_id= ?', [data.info, data.id, data.user_id], function (err, result, fields) {
                connection.release();
                callback(err, result);
            });
        });
        //return query.values;
    },

    addLocation: function (data, callback) {

        // if (data.start_time !== undefined) {
        //     var formatted_start_time = new Date(Number(data.start_time)).getUTCHours() + ":" + new Date(Number(data.start_time)).getUTCMinutes();
        //     data.start_time = formatted_start_time;
        // }
        // if (data.end_time !== undefined) {
        //     var formatted_end_time = new Date(Number(data.end_time)).getUTCHours() + ":" + new Date(Number(data.end_time)).getUTCMinutes();
        //     data.end_time = formatted_end_time;
        // }

        var sql = "SELECT * from user_locations where latitude = ? AND longitude = ? AND user_id = ?"
        model.db.getConnection(function (err, connection) {
            if (err) {
                connection.release();
                callback(err);
            }
            connection.query(sql, [data.latitude, data.longitude, data.user_id], function (err, result, fields) {
                if (err) {
                    callback(err);
                    connection.release();
                    return false;

                } else {
                    if (result.length > 0) {
                        callback(err, result);
                        connection.release();
                    } else {
                        connection.query('INSERT INTO user_locations SET ? ', data, function (err, result, fields) {
                            result.postedValue = data;
                            connection.release();
                            callback(err, result);
                        });
                    }
                }
            });
        });
    },
    getThisField: function (data, callback) {
        var self = this;
        var sql = "SELECT ?? FROM ?? WHERE ?? = ?";
        var fieldAndValue = [data.field, 'user_locations', data.prop, data.value];
        sql = this.db.format(sql, fieldAndValue);

        this.db.query(sql, function (err, results, fields) {
            if (err) {
                _generic.res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                return false;
            }
            callback(err, results);
        });
    },
    locationExists: function (data, callback) {

        var self = this;
        var sql = "SELECT * FROM ?? WHERE (?? = ? && ?? = ?) || (?? = ?  && ?? = ? && ?? =? ) ";
        var fieldAndValue = ['user_locations', 'location', data.location, 'user_id', data.userid, 'user_id', data.user_id, 'latitude', data.latitude, 'longitude', data.longitude];
        sql = this.db.format(sql, fieldAndValue);

        this.db.query(sql, function (err, results, fields) {
            if (err) {
                _generic.res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                return false;
            }
            callback(err, results);
        });

    }
});
module.exports = LocationModel;

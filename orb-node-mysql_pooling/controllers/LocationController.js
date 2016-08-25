var BaseController = require("./BaseController");
var UserModel = new (require("../models/UserModel"));
var UserSessionModel = new (require("./../models/UserSessionModel"));
var LocationModel = new (require("../models/LocationModel"));
var MessageModel = new (require("../models/MessageModel"));

var common = require('../libcustom/common');

module.exports = BaseController.extend({

    name: "location",
    content: null,
    addLocation: function (req, res, next) {

        var self = this;
        req.body.user_id = req.headers.userid;
        var reqdFields = { address: true, location: true, latitude: true, longitude: true, timekey: true };
        if (req.body.timekey === 'E') {
            reqdFields.start_time = true;
            reqdFields.end_time = true;
        }

        if (!LocationModel.validate(req, res, reqdFields)) {
            return false;
        }

        LocationModel.addLocation(req.body, function (err, results) {
            if (err) {
                res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
            }
            if (results.affectedRows > 0) {
                var rowData = results.postedValue;
                rowData.id = results.insertId;

                res.status(200).send(self.createResponse(rowData, {
                    success: true,
                    message: "Location added successfully"
                }));
            } else {
                res.status(200).send(self.createResponse({}, {
                    success: false,
                    message: "You have already added this location, please select a different geolocation"
                }));
            }
        });
    },
    updateLocation: function (req, res, next) {

        var data = {};
        data.info = req.body;
        data.id = req.body.id;
        data.user_id = req.headers.userid;
        var self = this;
        var reqdFields = { address: true, location: true, latitude: true, longitude: true, timekey: true };
        if (req.body.timekey === 'E') {
            reqdFields.start_time = true;
            reqdFields.end_time = true;
        }

        if (!LocationModel.validate(req, res, reqdFields)) {
            return false;
        }

        var row = LocationModel.updateLocation(data, function (err, result) {

            if (err) {
                res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
            } else {
                if (result.affectedRows > 0) {

                    res.status(200).send(self.createResponse(data.info, {
                        success: true,
                        message: "Location updated successfully"
                    }));
                } else {
                    res.status(200).send(self.createResponse({}, {
                        success: false,
                        message: "Location does not exist!"
                    }));
                }
            }
        });
    },

    checkUserLocation: function (req, res, next) {
        if (!LocationModel.validate(req, res, {
            latitude: true,
            longitude: true
        })) {
            return false;
        }
        var self = this;
        req.body.userid = req.headers.userid;
        LocationModel.matchNearestLocation(req.body, function (err, results) {
            if (err) {
                res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                console.log(err.message);
                return false;
            }
            if (!results.length) {
                res.status(200).send(self.createResponse({}, {
                    success: false,
                    message: "No location found!"
                }));
            } else {
                if (common.compare_timings(results[0].start_time, results[0].end_time)) {
                    MessageModel.updateMessageStatus(req.body.userid, results[0].id, function (err, result) {
                        if (err) {
                            res.status(400).send(
                                self.createResponse({}, {
                                    success: false,
                                    message: err.message
                                }));
                            return false;
                        }
                        if (result.affectedRows) {
                            var message_fetch = {
                                data: { FETCH_MESSAGE: 'FETCH_MESSAGE', MESSAGE: 'View all fetch messages' }
                            };
                            message_fetch.notification = {
                                title: 'Fetch Message',
                                body: 'View all fetch messages',
                                sound: 'default'
                            };
                            common.send_push(message_fetch, [results[0].device_token]);
                            res.status(200).send(self.createResponse({}, {
                                success: true,
                                message: "Location fetched successfully"
                            }));
                        } else {
                            res.status(200).send(self.createResponse({}, {
                                success: false,
                                message: "No new message!"
                            }));
                        }
                    });
                } else {
                    res.status(200).send(self.createResponse({}, {
                        success: false,
                        message: "No location found!"
                    }));
                }
            }
        });
    },

    deleteLocation: function (req, res, next) {

        req.body.userid = req.headers.userid;

        var self = this;
        if (!LocationModel.validate(req, res, {
            location_id: 'true'
        })) {
            return false;
        }

        LocationModel.deleteLocation(req.body, function (err, results) {
            if (err) {
                res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                console.log(err.message);
                return false;
            }
            if (results.affectedRows > 0) {
                res.status(200).send(self.createResponse({}, {
                    success: true,
                    message: "Location deleted successfully"
                }));
                console.log("Location deleted successfully");
            } else {
                res.status(499).send(self.createResponse({}, {
                    success: false,
                    message: "Location does not exist!"
                }));
            }
        });
    },
    getLocation: function (req, res, next) {

        var self = this;
        req.body.userid = req.headers.userid;

        // get user locations from database
        LocationModel.getLocation(req.body, function (err, result) {
            if (err) {
                res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                return false;
            }
            if (result.length > 0) {
                res.status(200).send(self.createResponse(result, {
                    success: true,
                    message: "User locations fetched successfully"
                }));
            } else {
                res.status(200).send(self.createResponse({}, {
                    success: false,
                    message: "There are no user locations yet"
                }));
            }
        });
    },

    IflocationExists: function (req, res, next) {

        var self = this;

        UserModel.setDB(req.db);
        LocationModel.setDB(req.db);

        req.body.userid = req.headers.userid;

        LocationModel.locationExists(req.body, function (err, result) {
            if (result.length > 0) {
                res.status(200).send(self.createResponse({}, {
                    success: false,
                    message: "User location already exists"
                }));
                console.log("User location already exist")
            }
            else {
                res.status(200).send(self.createResponse({}, {
                    success: true,
                    message: "User location does not exist..."
                }));
                console.log("User location does not exist......\n");
            }
        });

    }
});


    
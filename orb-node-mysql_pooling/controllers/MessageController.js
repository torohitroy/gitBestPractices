var BaseController = require("./BaseController");
var UserModel = new (require("../models/UserModel"));
var UserSessionModel = new (require("./../models/UserSessionModel"));
var MessageModel = new (require("./../models/MessageModel"));
var config = require('../config')();
var apn = require('apn');
//var options = {
//    cert: "./attachments/certificatespush.pem",
//    key: "./attachments/keypush.pem",
//    passphrase: "asdfgh"
//};
////var options = { "gateway": "gateway.sandbox.push.apple.com", "cert": "/home/staging-orb/orb-node/cert.pem", "key:":"/home/staging-orb/orb-node/key.pem","passphrase:": "asdfgh" };
//var apnConnection = new apn.Connection(options);
//var note = new apn.Notification();
//
//note.badge = 1;
//note.sound = "Ping.aiff";
//note.alert = "You received a message from server";
//
//note.payload = {'messageFrom': 'Orb'};


module.exports = BaseController.extend({
    name: "message",
    content: null,
    deleteMessage: function(req, res, next) {
        var isValidationError = MessageModel.validate(req, res, {
            msg_detail_id: true
        });
        if (isValidationError !== true) {
            res.status(400).send(this.createResponse({}, {
                success: false,
                message: isValidationError
            }));
            return false;
        }

        req.body.userid = req.headers.userid;
        var self = this;

        MessageModel.deleteMessage(req.body, function(err, results) {
            if (err) {
                res.status(400).send(
                        self.createResponse({}, {
                    success: false,
                    message: err.message
                }));
                return false;
            }
            if (results.affectedRows > 0) {
                res.status(200).send(self.createResponse({}, {
                    success: true,
                    message: "Message deleted successfully"
                }));
                console.log("Message deleted successfully");
            } else {
                res.status(200).send(self.createResponse({}, {
                    success: false,
                    message: "Message can not be deleted "
                }));
                console.log("Message can not be deleted ");
            }
        });
    },
    favoriteMessage: function(req, res, next) {

        req.body.userid = req.headers.userid;
        var self = this;
        UserModel.setDB(req.db);
        MessageModel.setDB(req.db);
        MessageModel.favoriteMessage(req.body, function(err, results) {
            if (results.affectedRows > 0) {
                res.status(200).send(self.createResponse({}, {
                    success: true,
                    message: "Message marked favorite successfully"
                }));
                console.log("Message marked favorite successfully");
            } else {
                res.status(499).send(self.createResponse({}, {
                    success: false,
                    message: "Message can not be marked favorite "
                }));
                console.log("Message can not be marked favorite ");
            }
        });
    },
    updateReadFlag: function(req, res, next) {

        req.body.userid = req.headers.userid;
        var self = this;
        MessageModel.updateReadFlag(req.body, function(err, results) {
            if (err) {
                res.status(400).send(
                        self.createResponse({}, {
                    success: false,
                    message: err.message
                }));
                return false;
            }
            if (results.affectedRows > 0) {
                res.status(200).send(self.createResponse({}, {
                    success: true,
                    message: "read flag updated successfully"
                }));
            } else {
                res.status(200).send(self.createResponse({}, {
                    success: false,
                    message: "read flag not updated "
                }));
            }
        });
    },
    getMessages: function(req, res, next) {

        req.body.userid = req.headers.userid;
        var self = this;
        UserModel.setDB(req.db);
        MessageModel.setDB(req.db);
        if (req.body.userid !== null && req.body.userid !== undefined && req.body.userid !== '' && req.body.location_id === null || req.body.location_id === undefined || req.body.location_id === '') {

            MessageModel.getReceivedMessagesOnUserId(req.body, function(err, results) {

                if (results.length > 0) {
                    res.status(200).send(self.createResponse(results, {
                        success: true,
                        message: "message fetched successfully"
                    }));
                    console.log("message fetched successfully");
                } else {
                    res.status(200).send(self.createResponse({}, {
                        success: false,
                        message: "message not fetched"
                    }));
                    console.log("message not fetched");
                }
            });
        }
        else if (req.body.location_id !== null && req.body.location_id !== undefined && req.body.location_id !== '') {

            console.log("inside location id else case")

            MessageModel.getUserTimeRange(req.body, function(err, user) {

                console.log(user);
                for (var i = 0; i < user.length; i++) {
                    if (user.length > 0) {
                        console.log("start_time" + user[i].start_time);
                        console.log("end_time" + user[i].end_time);
                        console.log("time key" + user[i].timekey);
                        var t = new Date().toTimeString().split(" ")[0];
                        var sub = t.slice(0, 5);
                        console.log("new ab" + sub);
                        var current_time = sub + ":00";
                        console.log("sahi time" + current_time);
                        if (user[i].timekey === 'D') {

                            console.log("inside first if")
                            MessageModel.getMessagesOnLocations(req.body, function(err, results) {
                                if (results.affectedRows > 0) {
                                    res.status(200).send(self.createResponse(results, {
                                        success: true,
                                        message: "Message(s) fetched successully"
                                    }));
                                    console.log("Message(s) fetched successfully");
                                } else {
                                    res.status(499).send(self.createResponse({}, {
                                        success: false,
                                        message: "Message(s) cannot be fetched"
                                    }));
                                    console.log("Message(s) cannot be fetched ");
                                }
                            });
                        }
                        else if (current_time >= user[i].start_time && current_time <= user[i].end_time && user[i].timekey === 'E') {

                            console.log("inside if else where key is enabled")

                            MessageModel.getMessagesOnLocations(req.body, function(err, results) {
                                console.log("here results" + results)
                                if (results.length > 0) {
                                    MessageModel.gettokenonlocations(req.body, function(err, user) { //send push in case of friend id

                                        var userTokens = [];
                                        Object.keys(user).forEach(function(key) {
                                            var val = user[key]["device_token"];
                                            userTokens.push(val);
                                        });
                                        console.log("all token ids");
                                        console.log(userTokens);
                                        if (user.length > 0) {
                                            console.log("inside sending push");
                                            apnConnection.pushNotification(note, userTokens);
                                            res.status(200).send(self.createResponse(results, {
                                                success: true,
                                                message: "Message(s) fetched successully"
                                            }));
                                            console.log("Message(s) fetched successfully");
                                        }
                                    })
                                } else {
                                    res.status(499).send(self.createResponse({}, {
                                        success: false,
                                        message: "Message(s) cannot be fetched"
                                    }));
                                    console.log("Message(s) cannot be fetched ");
                                }
                            });
                        }
                        else {
                            res.status(200).send(self.createResponse({}, {
                                success: true,
                                message: "User not in time range to receive message"
                            }));
                            console.log("User not in time range to receive message");
                        }
                    }
                }
            })
        }
    },
    getMessages2: function(req, res, next) {

        req.body.userid = req.headers.userid;
        var self = this;
        UserModel.setDB(req.db);
        MessageModel.setDB(req.db);
        var userTokens = [];
        var userTokens2 = [];
        var pushFunction = function(usertokens) {

            var options = {
                cert: './attachments/certificatespush.pem',
                key: './attachments/keypush.pem',
                passphrase: '123456'
            };

            var apnConnection = new apn.Connection(options);
            var note = new apn.Notification();
            note.badge = 1;
            note.sound = "Ping.aiff";
            note.alert = "You received a message";
            note.payload = {'messageFrom': 'Orb', 'content-available': 1};
            apnConnection.on('connected', function() {
                //console.log("Connected");
            });
            apnConnection.on('transmitted', function(notification, device) {
                //console.log("Notification transmitted to:" + usertokens.toString('hex'));
            });
            apnConnection.on('transmissionError', function(errCode, notification, device) {
                //console.error("Notification caused error: " + errCode + " for device ", usertokens, notification);
            });
            apnConnection.on('timeout', function() {
                //console.log("Connection Timeout");
            });
            apnConnection.on('disconnected', function() {
                //console.log("Disconnected from APNS");
            });
            apnConnection.on('socketError', console.error);
            apnConnection.pushNotification(note, usertokens);
        }

        var now = new Date();
        //console.log("current local time " + now);

        var inutc = now.getUTCHours();
        //console.log("in utc " + inutc);

        var inutc2 = now.getUTCMinutes();
        //console.log("utc minutes" + inutc2);

        var current_time = inutc + ":" + inutc2;
        //console.log("utc time is  " + current_time);

        if (req.body.location_id === null || req.body.location_id === undefined || req.body.location_id === '') {
            //console.log("only fetching messages")
            MessageModel.getReceivedMessages(req.body, function(err, results) {
                //console.log(results);
                if (results.length > 0) {
                    res.status(200).send(self.createResponse(results, {
                        success: true,
                        message: "message fetched successfully"
                    }));
                    //console.log("message fetched successfully");
                } else {
                    res.status(499).send(self.createResponse({}, {
                        success: false,
                        message: "message not fetched"
                    }));
                    //console.log("message not fetched");
                }
            });
        }
        else if (req.body.location_id !== null && req.body.location_id !== undefined && req.body.location_id !== '') {
            MessageModel.ifMessageNotSent(req.body, function(err, results) {    // check for messages not sent

                if (results.length > 0) {
                    MessageModel.getUserTimeRange(req.body, function(err, user) {       //get time range for this location
                        if (user.length > 0) {
                            //console.log("start_time " + user[0].start_time);
                            //console.log("end_time " + user[0].end_time);
                            //console.log("time key " + user[0].timekey);

                            if (user[0].timekey === 'D') {

                                MessageModel.gettokenonlocations(req.body, function(err, user) {  // only friend id present send push

                                    if (user.length > 0) {
                                        Object.keys(user).forEach(function(key) {
                                            var val = user[key]["device_token"];
                                            userTokens.push(val);
                                        });
                                        //console.log("all token ids");
                                        //console.log(userTokens);
                                        //console.log("inside sending push");
                                        pushFunction(userTokens);

                                        MessageModel.updatePushFlag(req.body, function(err, result) {
                                            if (result.affectedRows > 0) {
                                                res.status(200).send(self.createResponse({}, {
                                                    success: true,
                                                    message: "push notification sent successfully"
                                                }));
                                                //console.log("push notification sent successfully")
                                            }
                                        });
                                    }
                                })
                            }
                            else if (current_time > user[0].start_time && current_time < user[0].end_time && user[0].timekey === 'E') {

                                MessageModel.gettokenonlocations(req.body, function(err, users) {  // only friend id present send push

                                    if (users.length > 0) {
                                        Object.keys(users).forEach(function(key) {
                                            var val = users[key]["device_token"];
                                            userTokens2.push(val);
                                        });
                                        //console.log("current time when chking "+current_time);
                                        //console.log("start time whn checking "+user[0].start_time);
                                        //console.log("end time whn checking "+ user[0].end_time)
                                        //console.log("all token ids");
                                        //console.log(userTokens2);
                                        //console.log("inside sending push");
                                        pushFunction(userTokens2)

                                        MessageModel.updatePushFlag(req.body, function(err, result) {
                                            if (result.affectedRows > 0) {
                                                res.status(200).send(self.createResponse({}, {
                                                    success: true,
                                                    message: "push notification sent successfully"
                                                }));
                                                //console.log("push notification sent successfully")
                                            }
                                        });
                                    }
                                })
                            }
                            else {
                                res.status(200).send(self.createResponse({}, {
                                    success: true,
                                    message: "user not in time range to receive messagrs"
                                }));
                            }
                        }
                    });
                }
                else {
                    res.status(200).send(self.createResponse({}, {
                        success: false,
                        message: "no new messages"
                    }));
                    //console.log("no new messages");
                }
            });
        }
    },
    getSentMessages: function(req, res, next) {
        var data = {};
        data.userid = req.headers.userid;
        data.page = req.params.page;
        var self = this;
        MessageModel.getSentMessages(data, function(err, results) {
            if (err) {
                res.status(400).send(
                        self.createResponse({}, {
                    success: false,
                    message: err.message
                }));
                return false;
            }
            if (results.length > 0) {
                //console.log(results);
                res.status(200).send(self.createResponse(results, {
                    success: true,
                    message: "messages fetched successfully"
                }));
                //console.log("messages fetched successfully");
            } else {
                res.status(200).send(self.createResponse({}, {
                    success: false,
                    message: "messages can not be fetched "
                }));
                //console.log("messages can not be fetched ");
            }
        });
    },
    sendMessageLast: function(req, res, next) {
        var reqData = {};
        reqData.userid = req.headers.userid;
        var self = this;
        var isValidationError = MessageModel.validate(req, res, {
            friends: true,
            message_type: true,
            message: true
        });
        if (isValidationError !== true) {
            res.status(400).send(this.createResponse({}, {
                success: false,
                message: isValidationError
            }));
            return false;
        } else {
            reqData.friends = req.body.friends;
            //var uploadFunc = (req.body.message_type === 'A' ? 'uploadAudioToS3Bucket' : 'uploadVideoToS3Bucket');
            MessageModel['uploadFileToS3Bucket'].call(this, req.body, function(err, url) {
                if (err) {
                    res.status(400).send(self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                    return false;
                }
                var friends = reqData.friends;
                delete reqData.friends;
                reqData.message = url[1];
                reqData.thumb = url[0];
                reqData.message_type = req.body.message_type;
                MessageModel.saveMessage(reqData, friends, function(err, result) {
                    if (err) {
                        res.status(400).send(self.createResponse({}, {
                            success: false,
                            message: err.message
                        }));
                        return false;
                    }
                    res.status(200).send(self.createResponse({}, {
                        success: true,
                        message: "Message sent successfully"
                    }));
                });
            });
        }
    },
    getMessagesNew: function(req, res, next) {
        var data = {};
        data.userid = req.headers.userid;
        data.page = req.params.page;
        var self = this;
        MessageModel.getMessagesNew(data, function(err, results) {
            if (err) {
                res.status(400).send(self.createResponse({}, {
                    success: false,
                    message: err.message
                }));
                return false;
            }
            if (results.length > 0) {
                //console.log(results);
                res.status(200).send(self.createResponse(results, {
                    success: true,
                    message: "messages fetched successfully"
                }));
            } else {
                res.status(200).send(self.createResponse({}, {
                    success: true,
                    message: "messages cannot be fetched"
                }));
            }
        });
    },
    convertMessage: function(req, res, next) {

        //var a = req.body.message;
        //var filename = a.replace(/^.*[\\\/]/, '');
        //console.log("here filename" + filename)
        //var fileExt = filename.split('.');
        //var file = fileExt[0];
        //console.log("only name is" + file)
        var file = "ooo.mp3"
        var fluent_ffmpeg = require("fluent-ffmpeg");
        var fs = require('fs')
        var proc = fluent_ffmpeg();
        proc.setFfmpegPath("/home/dell/orb-node/ffmpeg");
        proc.addInput(fs.createReadStream())
                .outputOptions(['-movflags isml+frag_keyframe'])
                .toFormat("mp3")
                .audioBitrate('128k')
                .audioChannels(2)
                .audioCodec('libmp3lame')
                //.withAudioCodec('copy')
                .videoCodec('libx264')
                .videoBitrate(1000)
                .withSize("1280x720")
                .on("error", function(err) {
            //console.log("error in conversion: " + err);
        })
                .on('end', function() {
            //console.log("done convertion");
        })
                .saveToFile(file, function(stdout, stderr) {
            console.log("saved in file")
        });
        results = {};
        results.video_path = file;
        callback(err, results);
    },
});
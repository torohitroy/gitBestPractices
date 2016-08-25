var Model = require("./BaseModel");
var model = new Model();
var fs = require('fs');
var config = require('../config')();
var AWS = require('aws-sdk');
var fs = require('fs');
var ffmpeg = require("fluent-ffmpeg");
var path2 = require('path')

var MessageModel = model.extend({

    validate: function (data, res, rules) {
        if (rules.friends) {
            data.checkBody('friends', 'List of friends is required').hasFriendList();
        }
        if (rules.message_type) {
            data.checkBody('message_type', 'Message type is required').notEmpty();
        }
        if (rules.message) {
            data.checkBody('message', 'Message is required').notEmpty();
        }
        if (rules.msg_detail_id) {
            data.checkBody('msg_detail_id', 'Message detail id is required');
        }
        var errors = data.validationErrors();
        if (errors !== false) {
            return errors[0].msg;
        }
        return true;
    },

    deleteMessage: function (data, callback) {
        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            var sql = "UPDATE message_latest INNER JOIN message_sent_details on message_sent_details.message_id = message_latest.id SET message_sent_details.is_deleted = CASE WHEN message_sent_details.friend_id = ? && message_sent_details.is_deleted !=1 THEN is_deleted +1 WHEN message_latest.user_id = ? && message_sent_details.is_deleted !=2 THEN is_deleted +2 else message_sent_details.is_deleted END where message_sent_details.id = ? && (is_deleted +1) <4";
            var fieldAndValue = [data.userid, data.userid, data.msg_detail_id];
            sql = connection.format(sql, fieldAndValue);
            connection.query(sql, function (err, results) {
                connection.release();
                callback(err, results);
                // if (!err) {
                //     connection.query("SELECT count(message_id) as num from message_sent_details where id = '?'", [data.msg_id], function (err, result) {
                //         if (!result[0].num) {
                //             connection.query('DELETE from message_latest where id = ?', [data.msg_id], function (err, result1) {
                //                 connection.release();
                //             });
                //         } else {
                //             connection.release();
                //         }
                //     });
                // } else {
                //     connection.release();
                // }
            });
        });
    },
    favoriteMessage: function (data, callback) {

        console.log(data);
        var sql = "UPDATE messages SET fav_flag =?? WHERE user_id =? && id =?";
        var fieldAndValue = [data.fav_flag, data.userid, data.id];
        sql = this.db.format(sql, fieldAndValue);
        console.log(sql);
        var self = this;
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
    getThisField: function (data, callback) {

        var sql = "SELECT ??,??,?? FROM ?? WHERE ?? = ? ";
        var fieldAndValue = [data.field1, data.field2, data.field3, 'user_locations', data.prop, data.value];
        sql = this.db.format(sql, fieldAndValue);
        var self = this;
        this.db.query(sql, function (err, results, fields) {
            if (err) {
                _generic.res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                return false;
            }
            console.log(sql);
            callback(err, results);
        });
    },
    getReceivedMessages: function (data, callback) {

        //var sql = "SELECT m.*, u.username, u.profile_pic, ul.location FROM messages AS m INNER JOIN users AS u ON m.user_id = u.id LEFT JOIN user_locations AS ul ON m.location_id = ul.id WHERE m.friend_id = ? && m.push_flag = ? ";

        var sql = "SELECT m.id, m.user_id, m.message, m.friend_id, m.location_id, m.push_flag,m.is_read, m.fav_flag, m.created_at,m.modified_at, m.message_type, u.username, u.profile_pic, ul.location FROM messages AS m INNER JOIN users AS u ON m.user_id = u.id LEFT JOIN user_locations AS ul ON m.location_id = ul.id WHERE m.friend_id = ? && m.push_flag = ? ";
        var fieldAndValue = [data.userid, 'Y'];
        sql = this.db.format(sql, fieldAndValue);
        var self = this;
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
    getSentMessages: function (data, callback) {
        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            // var sql = " SELECT * FROM (SELECT m . * , u.username, u.profile_pic
            //  FROM message_latest AS m INNER JOIN users AS u ON m.friend_id = u.id
            //    WHERE m.user_id = ? UNION SELECT m . *, u.username, u.profile_pic 
            //    FROM message_latest AS m INNER JOIN user_locations AS ul
            //     ON m.location_id = ul.id LEFT JOIN users AS u ON u.id = ul.user_id
            //      WHERE m.user_id = ?)as a";
            var sql = 'SELECT m.message, m.user_id, ms.id as message_detail_id,m.thumb, ms.message_id, unix_timestamp(m.created_at) as created_at, m.message_type, unix_timestamp(ms.delivery_time) as delivery_time, ms.friend_id, ms.message_status, ms.is_read, u.username, u.profile_pic, ul.location, ul.address FROM users AS u INNER JOIN message_sent_details AS ms ON ms.friend_id = u.id INNER JOIN message_latest AS m ON ms.message_id = m.id LEFT JOIN user_locations AS ul ON FIND_IN_SET( ul.id, ms.location_id ) inner join ( select message_sent_details.id from message_sent_details left join message_latest on message_latest.id = message_sent_details.message_id where message_latest.user_id = ? order by message_sent_details.created_at desc limit ? , 10) as v2 on v2.id = ms.id where m.user_id = ? && ms.is_deleted != ? && ms.is_deleted < ? order by ms.created_at DESC';
            var fieldAndValue = [data.userid, Number(data.page) * 10, data.userid, 2, 3];
            sql = connection.format(sql, fieldAndValue);
            //console.log(sql);return false;
            var message_obj = {};
            connection.query(sql, function (err, results) {
                connection.release();
                if (results) {
                    results.forEach(function (val) {
                        if (!message_obj.hasOwnProperty(val.message_detail_id)) {
                            message_obj[val.message_detail_id] = val;
                            message_obj[val.message_detail_id].locations = [];
                        }
                        if (val.location) {
                            var loc = { location: val.location, address: val.address };
                            message_obj[val.message_detail_id].locations.push(loc);
                            delete message_obj[val.message_detail_id].location;
                            delete message_obj[val.message_detail_id].address;
                        }
                    });
                }
                callback(err, Object.keys(message_obj).map(function (key) { return message_obj[key] }));
            });
        });
    },
    getMessagesOnLocations: function (data, callback) {

        var loc_id_Array = [];
        var all_locations;
        for (var i = 0; i < data.location_id.length; i++) {
            loc_id_Array[i] = "'" + data.location_id[i] + "'";
        }
        all_locations = loc_id_Array.join(",");
        console.log(all_locations);
        var sql = 'SELECT u.username as senders_name,u.profile_pic as senders_profile_pic,m.id as message_id,m.user_id as senders_id,m.message,m.location_id as receivers_location_id,m.message_type,m.created_at as sent_time from ?? as u inner join ?? as m on u.id=m.user_id where m.location_id in (' + all_locations + ') ';
        var fieldAndValue = ['users', 'messages'];
        sql = this.db.format(sql, fieldAndValue);
        var self = this;
        this.db.query(sql, function (err, results, fields) {
            if (err) {
                _generic.res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                return false;
            }
            console.log(sql);
            callback(err, results);
        });
    },
    getLocationResult: function (callback) {
        data.location_time = '1458907200';
        var sql = "select ML.message,UL.id from ?? as MS left join " +
            "?? as ML on MS.message_id = ML.id inner join ?? as UL " +
            "where message_status='P' and FIND_IN_SET(UL.id,MS.locationid) and " +
            "(FROM_UNIXTIME(?,'%Y %D %M %h:%i:%s') BETWEEN FROM_UNIXTIME(UL.start_time,'%Y %D %M %h:%i:%s') " +
            "and FROM_UNIXTIME(UL.end_time,'%Y %D %M %h:%i:%s')) and MS.message_status='P'";
        var fieldAndValue = ['message_sent', 'message_latest', 'user_locations', data.location_time];
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
            callback(err, results);
        });
    },
    uploadVideoToS3Bucket: function (data, callback) {

        console.log("inside upload videos");
        var self = this;
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
        var video = "user_" + Math.floor(Date.now() / 1000) + ".mp4";
        path = '';
        var bitmap = new Buffer(data.message, 'base64');
        fs.writeFile(video, bitmap, function (err) {

            if (err) {
                console.log("write file error")
                console.log(err);
                callback(err, {});
            } else {
                var bodyStream = fs.createReadStream(video)

                var params = { Bucket: 'orbmitranscoder', Key: "users_videos/" + video, Body: bodyStream, ACL: 'public-read', ContentType: 'video/mp4' };
                s3.putObject(params, function (err, dataa) {
                    if (err) {
                        console.log("inside putobject error");
                        console.log(err);
                        path = '';
                        callback(err, {});
                    }
                    else {
                        var path = "http://orbmitranscoder.s3.amazonaws.com/users_videos/" + video;
                        console.log("Successfully uploaded data to Bucket orbmitranscoder");
                        console.log(path)
                        var userdata = {};
                        userdata.message = path;
                        userdata.userid = data.userid;
                        fs.unlink(video, function (err) {
                            if (err) {
                                console.log(err);
                            }
                            console.log("deleted file");
                        });
                        callback(false, userdata);
                    }
                });
            }
        });
    },

    uploadFileToS3Bucket: function (data, callback) {
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
        var uploadThumbToS3Bucket = function (filex, callback) {
            var extArr = filex.split('.');
            if (extArr[extArr.length - 1] != 'mp4') {
                callback(null, [null]);
                return false;
            }

            var filename = "user_" + Math.floor(Date.now() / 1000) + ".jpg";

            var proc = new ffmpeg(filex)
                .takeScreenshots({
                    count: 1,
                    timemarks: ['1'],// number of seconds
                    folder: process.cwd(),
                    filename: filename
                }).on('end', function () {
                    var key = 'user_thumb';
                    var bodyStream = fs.createReadStream(filename);
                    var params = { Bucket: 'orbmitranscoder', Key: key + "/" + filename, Body: bodyStream, ACL: 'public-read', ContentType: 'image/jpeg' };
                    // var params = {Bucket: 'orbmitranscoder', Key: "users_audios/" + audio, Body: bodyStream};
                    s3.putObject(params, function (err, dataa) {
                        if (err) {
                            callback(err, {});
                        } else {
                            //var path = "http://orbmitranscoder.s3.amazonaws.com/" + key + "/" + file;
                            fs.unlink(filename, function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                            callback(null, ["http://orbmitranscoder.s3.amazonaws.com/" + key + "/" + filename]);
                        }
                    });
                }).on('error', function (err, stdout, stderr) {
                    callback(err);
                });
        }
        if (data.message_type.toLowerCase() == 'a') {
            var format = 'mp3';
            var key = 'user_audios';
            var mime = 'mpeg3';
        } else if (data.message_type.toLowerCase() == 'v') {
            format = 'mp4'
            key = 'user_videos';
            mime = 'mp4';
        }
        var file = "user_" + Math.floor(Date.now() / 1000) + "." + format;

        var bitmap = new Buffer(data.message, 'base64');
        fs.writeFile(file, bitmap, function (err) {
            if (err) {
                console.log(err);
                callback(err, {});
            } else {
                uploadThumbToS3Bucket(file, function (err, thumbPath) {
                    if (err) {
                        callback(err);
                    }
                    var bodyStream = fs.createReadStream(file);
                    var params = { Bucket: 'orbmitranscoder', Key: key + "/" + file, Body: bodyStream, ACL: 'public-read', ContentType: 'audio/' + mime };
                    // var params = {Bucket: 'orbmitranscoder', Key: "users_audios/" + audio, Body: bodyStream};
                    s3.putObject(params, function (err, dataa) {
                        if (err) {
                            callback(err, {});
                        } else {
                            var path = "http://orbmitranscoder.s3.amazonaws.com/" + key + "/" + file;
                            thumbPath.push(path);
                            fs.unlink(file, function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                            callback(false, thumbPath);
                        }
                    });
                });
            }
        });
    },
    uploadVideoToS3Bucket2: function (data, callback) {

        console.log("inside upload videos");
        var self = this;
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
        var video = "user_" + Math.floor(Date.now() / 1000) + ".mp4";
        path = '';
        var bitmap = new Buffer(data.message, 'base64');
        fs.writeFile(video, bitmap, function (err) {

            if (err) {
                console.log("write file error")
                console.log(err);
                callback(err, {});
            } else {
                fs.readFile(video, function (err, datas) {
                    if (err) {
                        console.log('fs error' + err);
                    } else {
                        var params = {
                            Bucket: 'orbmitranscoder',
                            Key: "users_videos/" + video,
                            Body: datas,
                            ACL: 'public-read',
                            //ContentType: 'video/mp4'
                        };

                        s3.putObject(params, function (err, data) {
                            if (err) {
                                console.log('Error putting object on S3: ', err);
                            } else {
                                path = "http://orbmitranscoder.s3.amazonaws.com/users_videos/" + video;
                                console.log("Successfully uploaded data to Bucket orbmitranscoder");
                                console.log(path)
                                userdata = {};
                                userdata.message = path;
                                userdata.userid = data.userid;
                                fs.unlink(video, function (err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    console.log("deleted file");
                                });
                                callback(false, userdata);
                            }
                        });
                    }
                });

            }


        });
    },
    uploadAudioToS3Bucket: function (data, callback) {

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
        var audio = "user_" + Math.floor(Date.now() / 1000) + ".wav";

        var bitmap = new Buffer(data.message, 'base64');
        fs.writeFile(audio, bitmap, function (err) {
            if (err) {
                console.log(err);
                callback(err, {});
            } else {
                var bodyStream = fs.createReadStream(audio);
                var params = { Bucket: 'orbmitranscoder', Key: "users_audios/" + audio, Body: bodyStream, ACL: 'public-read', ContentType: 'audio/wav' };
                // var params = {Bucket: 'orbmitranscoder', Key: "users_audios/" + audio, Body: bodyStream};
                s3.putObject(params, function (err, dataa) {
                    if (err) {
                        callback(err, {});
                    } else {
                        var path = "http://orbmitranscoder.s3.amazonaws.com/users_audios/" + audio;
                        fs.unlink(audio, function (err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                        callback(false, path);
                    }
                });
            }
        });
    },
    saveFileWithLocationToDb: function (data, callback) {
        console.log("data in saveFileWithLocationToDb");
        console.log(data);
        var self = this;
        var i = 0;
        valueArray = [];
        for (var j = 0; j < data.location_id.length; j++) {
            valueString = '(';
            valueString += "'" + data.userid + "'";
            valueString += ',' + "'" + data.message + "'";
            valueString += ',' + "'" + data.location_id[j] + "'";
            valueString += ',' + "'" + data.message_type + "'";
            valueString += ',' + "'" + data.friend_id[j] + "'";
            valueString += ',' + "'" + data.created_at + "'";
            valueString += ')';
            valueArray[i++] = valueString;
        }
        valueString = valueArray.join(',');
        console.log(valueString);
        var query = self.db.query('INSERT INTO messages(user_id,message,location_id,message_type,friend_id,created_at ) VALUES ' + valueString, function (err, result, fields) {
            if (err) {
                _generic.res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                return false;
            }
            console.log(query.sql)
            callback(err, result);
        });
    },

    saveMessage: function (data, friends, callback) {
        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            connection.query('INSERT INTO message_latest (user_id,message,message_type,thumb) values (? , ?, ?, ?)', [data.userid, data.message, data.message_type, data.thumb], function (err, result) {
                if (err) {
                    callback(err);
                    return false;
                }
                friends.forEach(function (val, i) {
                    connection.query('INSERT INTO message_sent_details (message_id, location_id, friend_id) values( ?, ?, ?)', [result.insertId, val.location_id.join(), val.friend_id], function (err, result1) {
                        if (i + 1 == friends.length) {
                            connection.release();
                            callback(err, result1);
                        }
                    });
                });
            });
        });
    },
    getMessagesNew: function (data, callback) {

        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            if (data.page == -1) {
                var sql = "select MS.id as message_detail_id,MS.message_id, ML.thumb, ML.user_id as friend_id,unix_timestamp(MS.delivery_time) as delivery_time, MS.is_delivered, ML.message as messageURL,MS.message_status,MS.is_read as is_read,ML.message_type as message_type,US.username,US.profile_pic from message_sent_details as MS inner join " +
                    "message_latest as ML on  ML.id=MS.message_id inner join users as US on US.id=ML.user_id where MS.message_status=? and MS.friend_id=? and MS.is_deleted != ? and MS.is_deleted < ? && MS.is_delivered = 0 order by MS.created_at DESC";
                var fieldAndValue = ['R', data.userid, 1, 3];
            } else {
                sql = "select MS.id as message_detail_id,MS.message_id, ML.thumb, ML.user_id as friend_id,unix_timestamp(MS.delivery_time) as delivery_time, MS.is_delivered, ML.message as messageURL,MS.message_status,MS.is_read as is_read,ML.message_type as message_type,US.username,US.profile_pic from message_sent_details as MS inner join " +
                "message_latest as ML on  ML.id=MS.message_id inner join users as US on US.id=ML.user_id where MS.message_status=? and MS.friend_id=? and MS.is_deleted != ? and MS.is_deleted < ? order by MS.created_at DESC limit ?, 10";
                fieldAndValue = ['R', data.userid, 1, 3, Number(data.page) * 10];
            }


            sql = connection.format(sql, fieldAndValue);

            connection.query(sql, function (err, results) {
                var message_delivered = [];
                results.forEach(function (val) {
                    if (!val.is_delivered) {
                        message_delivered.push(val.message_detail_id);
                    }
                });
                if (message_delivered.length) {
                    connection.query('UPDATE message_sent_details set is_delivered = ? where id in (?)', [1, message_delivered], function (err, result) {
                        connection.release();
                        callback(err, results);
                    });
                } else {
                    connection.release();
                    callback(err, results);
                }
            });
        });
    },
    updateMessageStatus: function (user_id, location_id, callback) {
        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            connection.query('UPDATE message_sent_details set message_status = ?, delivery_time =FROM_UNIXTIME(?) where friend_id = ? and message_status = ? and FIND_IN_SET(?, location_id)', ['R', Math.floor(new Date().getTime() / 1000), user_id, 'P', location_id], function (err, result) {
                connection.release();
                callback(err, result);
            });
        });
    },

    saveFileToDb: function (data, callback) {
        console.log("data in savetofiledb");
        console.log(data);
        var self = this;
        var i = 0;
        valueArray = [];

        valueString = '(';
        valueString += "'" + data.userid + "'";
        valueString += ',' + "'" + data.message + "'";
        valueString += ',' + "'" + data.message_type + "'";
        valueString += ',' + "'" + data.created_at + "'";
        valueString += ')';
        // valueArray[i++] = valueString;
        // valueString = valueArray.join(',');
        // console.log(valueString);
        var query = self.db.query('INSERT INTO message_latest(user_id,message,message_type,created_at ) VALUES ' + valueString, function (err, result, fields) {
            if (err) {
                _generic.res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                return false;
            }
            console.log(query.sql)
            callback(err, result);
        });
    },
    sentMessage: function (data, callback) {
        //console.log(data);
        var self = this;
        var i = 0;
        valueArray = [];
        var valueStringg = '';
        for (var i = 0; i < data.locations.length; i++) {
            //  valueArray=;
            if ((data.locations.length - 1) > i) {
                valueStringg += data.locations[i] + ',';
            } else {
                valueStringg += data.locations[i];
            }
        }
        valueString = '(';
        valueString += "'" + data.friend_id + "'";
        valueString += ',' + "'" + valueStringg + "'";
        valueString += ',' + "'" + data.inserid + "'";
        //valueString += ',' + "'" + "N" + "'";
        valueString += ')';
        var query = self.db.query('INSERT INTO message_sent(friend_id,locationid,message_id) VALUES ' + valueString, function (err, result, fields) {
            if (err) {
                _generic.res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                return false;
            }
            console.log(query.sql)
            callback(err, result);
        });
    },
    getUserTimeRange: function (data, callback) {

        var loc_id_Array = [];
        var all_locations;
        for (var i = 0; i < data.location_id.length; i++) {
            loc_id_Array[i] = "'" + data.location_id[i] + "'";
        }
        all_locations = loc_id_Array.join(",");
        console.log(all_locations);
        var sql = 'SELECT u.username,u.device_token,ul.start_time,ul.end_time,ul.timekey,ul.id FROM ?? as u inner join ?? as ul on u.id=ul.user_id WHERE ul.id IN (' + all_locations + ') ';
        var fieldAndValue = ['users', 'user_locations'];
        sql = this.db.format(sql, fieldAndValue);
        var self = this;
        this.db.query(sql, function (err, results, fields) {
            if (err) {
                _generic.res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                return false;
            }
            console.log(sql);
            callback(err, results);
        });
    },
    updatePushFlag: function (data, callback) {

        console.log(data);
        var sql = "UPDATE messages SET push_flag =? WHERE location_id =?";
        var fieldAndValue = ['Y', data.location_id];
        sql = this.db.format(sql, fieldAndValue);
        console.log(sql);
        var self = this;
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
    gettokenoffriends: function (data, callback) {

        var friend_id_Array = [];
        var all_friends;
        for (var i = 0; i < data.friend_id.length; i++) {
            friend_id_Array[i] = "'" + data.friend_id[i] + "'";
        }
        all_friends = friend_id_Array.join(",");
        console.log("inside model" + all_friends);
        var sql = 'SELECT u.device_token,u.device_type FROM ?? as u inner join ?? as m on u.id=m.friend_id WHERE m.friend_id IN (' + all_friends + ') GROUP BY m.friend_id';
        var fieldAndValue = ['users', 'messages'];
        sql = this.db.format(sql, fieldAndValue);
        var self = this;
        this.db.query(sql, function (err, results, fields) {
            if (err) {
                _generic.res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                return false;
            }
            console.log(sql);
            //console.log("results in model query");
            //console.log(results)
            callback(err, results);
        });
    },
    gettokenonlocations: function (data, callback) {

        var location_id_Array = [];
        var all_locations;
        for (var i = 0; i < data.location_id.length; i++) {
            location_id_Array[i] = "'" + data.location_id[i] + "'";
        }
        all_locations = location_id_Array.join(",");
        console.log("inside model" + all_locations);
        var sql = 'SELECT u.username,u.device_token,u.device_type,ul.id,ul.location FROM ?? as u inner join ?? as ul on u.id=ul.user_id WHERE ul.id IN (' + all_locations + ') ';
        var fieldAndValue = ['users', 'user_locations'];
        sql = this.db.format(sql, fieldAndValue);
        var self = this;
        this.db.query(sql, function (err, results, fields) {
            if (err) {
                _generic.res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                return false;
            }
            console.log(sql);
            //console.log("results in model query of locations");
            //console.log(results)
            callback(err, results);
        });
    },
    updateReadFlag: function (data, callback) {

        model.db.getConnection(function (err, connection) {
            if (err) {
                callback(err);
                return false;
            }
            var sql = "UPDATE ?? SET ??=? WHERE ??=? && ??=? && ??=?";
            var fieldAndValue = ['message_sent_details', 'is_read', 'Y', 'id', data.msg_detail_id, 'friend_id', data.userid, 'message_status', 'R'];
            sql = connection.format(sql, fieldAndValue);
            connection.query(sql, function (err, results) {
                connection.release();
                callback(err, results);
            });
        });
    },
    ifMessageNotSent: function (data, callback) {

        var sql = "SELECT * FROM ?? WHERE ??=? && ??=?";
        var fieldAndValue = ['messages', 'location_id', data.location_id, 'push_flag', 'N'];
        sql = this.db.format(sql, fieldAndValue);
        var self = this;
        this.db.query(sql, function (err, results, fields) {
            if (err) {
                _generic.res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                return false;
            }
            console.log(sql);
            callback(err, results);
        });
    },
    updatePushFlagForFriend_id: function (data, callback) {

        var friend_id_Array = [];
        var friend_id;
        for (var i = 0; i < data.friend_id.length; i++) {
            friend_id_Array[i] = "'" + data.friend_id[i] + "'";
        }
        friend_id = friend_id_Array.join(",");
        console.log("inside model" + friend_id);
        //console.log(data);
        var sql = 'UPDATE messages SET push_flag =? WHERE friend_id IN (' + friend_id + ') ';
        var fieldAndValue = ['Y', data.location_id];
        sql = this.db.format(sql, fieldAndValue);
        console.log(sql);
        var self = this;
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
    updatevideo: function (data, callback) {
        console.log("inside user image");
        var self = this;
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
        var video = "user_" + Math.floor(Date.now() / 1000) + ".mp4";
        path = '';

        var bitmap = new Buffer(data.message, 'base64');
        fs.writeFile(video, bitmap, function (err) {

            if (err) {
                throw err;
                path = ''
            } else {
                path = "http://orbmitranscoder.s3.amazonaws.com/users/" + video;
                s3.createBucket({ Bucket: 'orbmitranscoder' }, function () {


                    var bodyStream = fs.createReadStream(video);

                    var params = { Bucket: 'orbmitranscoder', Key: "users/" + video, Body: bodyStream, ACL: 'public-read', ContentType: 'video/mp4' };
                    s3.putObject(params, function (err, data) {

                        if (err) {
                            console.log(err);
                            path = '';
                        } else {
                            path = "http://orbmitranscoder.s3.amazonaws.com/users/" + video;
                            console.log("Successfully uploaded data to Bucket orbmitranscoder");

                        }
                        fs.unlink(video, function (err) {
                            if (err) {
                                console.log(err);
                            }
                            console.log("deleted file");
                        });
                    });

                });
                userdata = {};
                userdata.message = path;
                userdata.userid = data.userid;
                callback(err, userdata);
            }

        });

    },
    uploadAudioToS3Bucket2: function (data, callback) {

        console.log("inside upload audios");
        var self = this;
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

        file = "check" + Math.floor(Date.now() / 1000) + ".mp3"
        var audio = "user_" + Math.floor(Date.now() / 1000) + ".ogg";
        path = '';
        var bitmap = new Buffer(data.message, 'base64');
        //console.log(bitmap);
        fs.writeFile(audio, bitmap, function (err) {

            if (err) {
                console.log("write file error")
                console.log(err);
                callback(err, {});
            } else {
                splitPathRe = path2.resolve(__dirname);
                var arrsplt = splitPathRe.split('\models');
                proc.setFfmpegPath(arrsplt[0] + "/ffmpeg");
                //proc.setFfmpegPath("/var/www/orb-android/ffmpeg");
                proc.addInput(fs.createReadStream(audio))
                    .outputOptions(['-movflags isml+frag_keyframe'])
                    .toFormat("mp3")
                    .audioBitrate('128k')
                    .audioChannels(2)
                    .audioCodec('libmp3lame')
                //.withAudioCodec('copy')
                //.videoCodec('libx264')
                //.videoBitrate(1000)
                //.withSize("1280x720")
                    .on('start', function (cmd) {
                        console.log('Started ' + cmd);
                    })
                    .on("error", function (err) {
                        console.log("error in conversion: " + err.message);
                    })
                    .on('end', function () {
                        console.log("done convertion");
                        console.log("looooooooo");
                        console.log(file);
                        var bodyStream = fs.createReadStream(file);
                        var params = { Bucket: 'orbmitranscoder', Key: "users_audios/" + file, Body: bodyStream, ACL: 'public-read', ContentType: 'audio/3gpp' };

                        s3.putObject(params, function (err, dataa) {
                            console.log("inside put obkect")

                            if (err) {
                                console.log("inside putobject error")
                                console.log(err);
                                path = '';
                                callback(err, {});
                            } else {
                                path = "http://orbmitranscoder.s3.amazonaws.com/users_audios/" + file;
                                console.log("Successfully uploaded data to Bucket orbmitranscoder");
                                console.log(path);
                                userdata = {};
                                userdata.message = path;
                                userdata.userid = data.userid;
                                fs.unlink(audio, function (err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    console.log("deleted file");
                                });
                                callback(false, userdata);
                            }
                        });
                    })
                    .saveToFile(file, function () {

                    });
            }

        });
    },
    convertMessage: function (data, callback) {
        console.log("data is new message");
        console.log(data);
        var file = "www.mp3"
        var fluent_ffmpeg = require("fluent-ffmpeg");
        var fs = require('fs')
        var proc = fluent_ffmpeg();
        proc.setFfmpegPath("/home/dell/orb-node/ffmpeg");
        proc.addInput(fs.createReadStream(data))
            .outputOptions(['-movflags isml+frag_keyframe'])
            .toFormat("mp3")
            .audioBitrate('128k')
            .audioChannels(2)
            .audioCodec('libmp3lame')
        //.withAudioCodec('copy')
            .videoCodec('libx264')
            .videoBitrate(1000)
            .withSize("1280x720")
            .on("error", function (err) {
                console.log("error in conversion: " + err);
            })
            .on('end', function () {
                console.log("done convertion");
            })
            .saveToFile(file, function (stdout, stderr) {
                console.log("saved in file")
            });
        results = {};
        results.name = file;
        //        results.video_path = filename;
        callback(err, results);
    }
});
module.exports = MessageModel;
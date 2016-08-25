var BaseController = require("./BaseController");
var UserModel = new (require("../models/UserModel"));
var UserSessionModel = new (require("./../models/UserSessionModel"));
var fs = require('fs');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var config = require('../config')();
var md5 = require('md5');
var MobileDetect = require('mobile-detect');
//console.log(UserModel);

module.exports = BaseController.extend({
    name: "user",
    content: null,
    forgotPasswordMailSend: function(email, link) {

        var data = '<p> Please click on the following link to regenerate your password :</p><a href="http://' + link + '">' + link + '</a>';

        var transporter = nodemailer.createTransport(config.email_config);

        var mailOptions = {
            from: '"Orb" ' + config.email_details.username,
            to: email,
            subject: 'Regenerate New Password',
            text: "Test",
            html: data
        };

        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                return console.log(error);
            }
        });
    },
    confirmationMailSend: function(link, email) {
        var data = '<p>Hi There!<br/><br/> Before you can begin sending Orb messages with your friends and family, you need to activate your account. To activate your account, please click on the link below:<br/><br/><a href="http://' + link + '">' + link + '</a><br/><br/>Once you have activated your account, you will be able to log in to the OrbMi app.<br/><br/>Thanks!<br/><br/>The OrbMi Team </p>';

        var transporter = nodemailer.createTransport(config.email_config);

        var mailOptions = {
            from: '"Orb" ' + config.email_details.username,
            to: email,
            subject: 'Activate your OrbMi Account',
            html: data
        };

        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                return console.log(error);
            }
        });
    },
    email_verification: function(req, res, next) {
        var self = this;
        var token = req.params.token;
        // console.log("Value changes successfully"+token);
        UserModel.setDB(req.db);

        UserModel.getUserByConfirmToken(token, function(err, results) {
            if (err) {
                res.status(400).send(self.createResponse({},
                        {
                            success: false,
                            message: "Something goes wrong"
                        }));
                return false;
            } else {
                UserModel.enableActive(token, function(err, result) {
                    if (err) {
                        res.status(400).send(self.createResponse({},
                                {
                                    success: false,
                                    message: "Something goes wrong"
                                }));
                        return false;
                    } else {
                        var path = require("path");
                        res.render('success_message', {userInfo: result[0], is_valid_url : results.length});
                    }
                });
            }
        });
    },
    download_app: function(req, res, next) {
        var self = this;
        var md = new MobileDetect(req.headers['user-agent']);
        console.log(md.mobile());          // 'Sony'
        console.log(md.phone());           // 'Sony'
        console.log(md.tablet());          // null
        console.log(md.os());              // 'AndroidOS'
        console.log(md.is('iPhone'));      // false

        if (md.is('iPhone')) {
            var link = "http://itunes.apple.com/in/app/city-surf/id1057566260?mt=8";
        } else {
            var link = "http://play.google.com/store/apps/details?id=com.citysurfapp.citysurf&hl=en";
        }
        res.redirect(link);
    },
    forgotPasswordEmail: function(req, res, next) {
        console.log("1");
        var email = req.body.email;
        var link;
        var self = this;

        //UserModel.setDB(req.db);
        UserModel.getEmail(email, function(err, result) {
            if (err) {
                res.status(400).send(self.createResponse({},
                        {
                            success: false,
                            message: "Something goes wrong"
                        }));
                return false;
            } else {
                if (result.length > 0) {
                    if (result[0].isActive == 1) {
                        var token = Math.random().toString(36).substring(2, 10);
                        UserModel.setPassToken(result[0].id, token, function(err, result1) {
                            if (err) {
                                res.status(400).send(self.createResponse({},
                                        {
                                            success: false,
                                            message: err.message
                                        }));
                                return false;
                            }
                            link = config.server_details.host + 'api/v1/regeneratePassword/' + result[0].id + '-' + token;
                            self.forgotPasswordMailSend(result[0].email, link);

                            res.status(200).send(self.createResponse({},
                                    {
                                        success: true,
                                        message: "Email has been sent, please check your inbox."
                                    }));
                        });
                    } else {
                        res.status(200).send(self.createResponse({},
                                {
                                    success: false,
                                    message: "This account is Inactive, Please verify your account first."
                                }));
                    }
                } else {
                    res.status(200).send(self.createResponse({},
                            {
                                success: false,
                                message: "Account does not exist!"
                            }));
                }
            }
        });
    },
    regeneratePassword: function(req, res, next) {
        var parameters = req.params.id.split('-');
        UserModel.canResetPassword(parameters, function(err, result) {
            if (err) {
                res.status(400).send(self.createResponse({},
                        {
                            success: false,
                            message: "Something goes wrong"
                        }));
                return false;
            }
            if (result[0].isActiveLink) {
                res.render('reset_password', {
                    'id': parameters[0],
                    'token': parameters[1]
                });
            } else {
                res.render('link_expired');
            }

        });
    },
    resetPassword: function(req, res, next) {

        var self = this;
        req.assert('reset_password', 'Password length should be between 6 & 20').len(6, 20);
        req.assert('reset_password', 'Password is required').notEmpty();
        req.assert('reset_password', 'Passwords do not match').equals(req.body.reset_confirm_password);

        var mappedErrors = req.validationErrors(true);
        //console.log(mappedErrors.reset_password);
        //UserModel.setDB(req.db);
        if (mappedErrors) {
            var resp = {id: req.body.id, token: req.body.reset_password_token};
            resp.error = mappedErrors.reset_password.msg;
            res.render('reset_password', resp);

        } else {
            var data = {
                id: req.body.id,
                reset_password_token: req.body.reset_password_token,
                password: md5(req.body.reset_password)
            }
            UserModel.reset_password(data, function(err, result) {
                if (err) {
                    console.log("something goes wrong");
                } else {
                    if (result.affectedRows) {
                        res.render('acknowledge');
                    } else {
                        res.render('link_expired');
                    }
                }
            });
        }
    },
    register: function(req, res, next) {

        var current_date = (new Date()).valueOf().toString();
        var random = Math.random().toString();

        var token = crypto.createHash('sha1').update(current_date + random).digest('hex');

        var self = this;

        var reqdFields = {name: true, email: true, registration_type: true, device_type: true, device_token: true}
        // validate req parameters before inserting them
        if (req.body.registration_type.toLowerCase() === 'o') {
            reqdFields.password = true;
        } else {
            reqdFields.fb_id = true;
            reqdFields.fb_token = true;
        }
        if (!UserModel.validate(req, res, reqdFields)) {
            return false;
        }
        var device_token = req.body.device_token;
        var device_type = req.body.device_type;
        req.body.token = token;

        UserModel.getEmail(req.body.email, function(err, result) {
            if (err) {
                res.status(400).send(
                        self.createResponse({}, {
                    success: false,
                    message: err.message
                }));
            }
            if (result.length < 1) {
                if (req.body.registration_type.toLowerCase() === 'o') {
                    UserModel.register(req.body, function(err, result) {
                        if (err) {
                            res.status(400).send(
                                    self.createResponse({}, {
                                success: false,
                                message: err.message
                            }));
                            return false;
                        }

                        if (result.affectedRows > 0) {
                            UserModel.makeFriendTotheirSelf(result.dataSet.user_id, req.body.email);
                            // Prepare session data
                            var sessionData = {};
                            sessionData = result.dataSet;
                            sessionData.device_type = req.body.device_type;
                            //UserSessionModel.setDB(req.db);
                            UserSessionModel.createSessionToken(sessionData, function(err, results, token) {
                                if (err) {
                                    res.status(400).send(self.createResponse({}, {
                                        success: false,
                                        message: err.message
                                    }));
                                    return false;
                                }
                                var resp = {};
                                resp.userid = result.dataSet.user_id;
                                resp.token = token;

                                res.status(200).send(self.createResponse({},
                                        {
                                            success: true,
                                            isActive: 0,
                                            message: "Registration successful, please check your email"
                                        }));
                            });
                            self.confirmationMailSend(config.server_details.host + 'confirm_email/' + req.body.token, req.body.email);
                        }
                        else {
                            res.status(200).send(self.createResponse({},
                                    {
                                        success: false,
                                        message: "User can not be registered"
                                    }));
                        }
                    });
                }
                else if (req.body.registration_type.toLowerCase() === 'f') {
                    UserModel.registerfacebook(req.body, function(err, result) {
                        if (err) {
                            res.status(400).send(
                                    self.createResponse({}, {
                                success: false,
                                message: err.message
                            }));
                            console.log(err.message);
                            return false;
                        }

                        if (result.affectedRows > 0) {
                            UserModel.makeFriendTotheirSelf(result.dataSet.user_id, req.body.email);
                            // Prepare session data
                            var sessionData = {};

                            sessionData = result.dataSet;
                            sessionData.device_type = req.body.device_type;

                            //UserSessionModel.setDB(req.db);
                            UserSessionModel.createSessionToken(sessionData, function(err, results, token) {

                                var resp = {};
                                resp.userid = result.dataSet.user_id;
                                resp.token = token;

                                if (req.body.isVerified == 1) {
                                    //for verified users
                                    //console.log("TEST => ",result);
                                    UserModel.enableActiveVerifiedUser(result.dataSet.user_id, function(err, result2) {
                                        if (err) {
                                            res.status(400).send(self.createResponse({}, {
                                                success: false,
                                                message: err.message
                                            }));
                                            return false;
                                        }
                                        //console.log("UNDER => ", result.dataSet.user_id);
                                        var data = {};
                                        data.email = req.body.email;
                                        data.device_token = device_token;
                                        data.device_type = device_type;
                                        UserModel.updateUserLogin(data, function(err, result2) {
                                            if (err) {
                                                res.status(400).send(self.createResponse({}, {
                                                    success: false,
                                                    message: err.message
                                                }));
                                                return false;
                                            }
                                            res.status(200).send(self.createResponse(resp,
                                                    {
                                                        success: true,
                                                        isActive: 1,
                                                        message: "User registered successfully"
                                                    }));
                                        });
                                    });
                                } else {
                                    //for not verified users
                                    res.status(200).send(self.createResponse({},
                                            {
                                                success: true,
                                                isActive: 0,
                                                message: "Registration successful, please check your email"
                                            }));
                                    self.confirmationMailSend(config.server_details.host + 'confirm_email/' + req.body.token, req.body.email);
                                }
                            });
                        }
                        else {
                            res.status(200).send(self.createResponse({}, {
                                success: false,
                                message: "User can not be registered"
                            }));
                            console.log("User can not be registered...");
                        }
                    });
                }
            }
            else {

                UserModel.isActive(req.body.email, function(err, result) {
                    if (err) {
                        res.status(400).send(
                                self.createResponse({}, {
                            success: false,
                            message: err.message
                        }));
                        return false;
                    }
                    if (result[0].isActive == 0) {
                        res.status(200).send(self.createResponse({}, {
                            success: false,
                            isActive: result[0].isActive,
                            message: "Please verify your email"
                        }));
                    }
                    else {
                        res.status(200).send(self.createResponse({}, {
                            success: false,
                            isActive: result[0].isActive,
                            message: "Already registered, Please login"
                        }));
                    }
                });
            }
        });
    },
    login: function(req, res, next) {

        var self = this;

        var data = {};
        if (req.body.pass_token) {
            if (!UserModel.validate(req, res, {
                email: true,
                device_type: true,
                device_token: true
            })) {
                return false;
            }
            data = {
                email: req.body.email,
                pass_token: req.body.pass_token
            }
        } else {
            if (!UserModel.validate(req, res, {
                email: true,
                password: true,
                device_type: true,
                device_token: true
            })) {
                return false;
            }
            data = {
                email: req.body.email,
                password: req.body.password
            }
        }
        UserModel.checkUser(data, function(err, results, fields) {
            if (err) {
                res.status(400).send(self.createResponse({}, {
                    success: false,
                    message: err.message
                }));
                return false;
            }
            if (results.length > 0) {
                if ((md5(req.body.password)) == results[0].password || req.body.pass_token == results[0].pass_token) {
                    var sessionData = results[0];
                    sessionData.user_id = sessionData.id;
                    sessionData.device_type = req.body.device_type;
                    if (results[0].isActive == 1 || (req.body.pass_token && results[0].isActive == 0)) {
                        // If user exists create user token in table
                        //UserSessionModel.setDB(req.db);
                        UserSessionModel.createSessionToken(sessionData, function(err, result, token) {
                            if (err) {
                                res.status(400).send(self.createResponse({}, {
                                    success: false,
                                    message: err.message
                                }));
                                return false;
                            }

                            UserModel.updateUserLogin(req.body, function(err, result1) {
                                if (err) {
                                    res.status(400).send(
                                            self.createResponse({}, {
                                        success: false,
                                        message: err.message
                                    }));
                                    return false;
                                }
                                res.status(200).send(self.createResponse({
                                    token: token,
                                    userid: results[0].id,
                                    isFirstLogin: !results[0].isFirstLogin
                                }, {
                                    success: true,
                                    isActive: 1,
                                    message: "User has logged in successfully"
                                }));
                            });
                        });
                    } else {
                        res.status(200).send(self.createResponse({}, {
                            success: true,
                            isActive: results[0].isActive,
                            message: "Account is inactive"
                        }));
                    }
                } else {
                    res.status(200).send(self.createResponse({}, {
                        success: false,
                        message: (req.body.pass_token ? (results[0].pass_token == null ? "Account is already active. Please login" : "Wrong pass token") : "Wrong password")
                    }));
                }
            } else {
                res.status(200).send(self.createResponse({}, {
                    success: false,
                    message: "Email is not registered with us"
                }));
            }
        });
    },
    updateSettings: function(req, res, next) {

        req.body.id = req.headers.userid;

        var self = this;
        //        UserModel.setDB(req.db);
        var fieldsToValidate = {};
        if (req.body.hasOwnProperty('profile_pic')) {
            fieldsToValidate.profile_pic = true;
        }
        if (req.body.hasOwnProperty('user_status')) {
            fieldsToValidate.user_status = true;
        }
        if (!Object.keys(fieldsToValidate).length) {
            res.status(400).send(
                    self.createResponse({}, {
                success: false,
                message: 'profile_pic or user_status is required'
            }));
            return false;
        }

        if (!UserModel.validate(req, res, fieldsToValidate)) {
            return false;
        }
        // if (req.body.profile_pic.match(/fbcdn-profile-a.akamaihd.net/gi)) {

        UserModel.updateSettings(req.body, function(err, results) {
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
                    message: "Image and/or status updated successfully"
                }));
                console.log("Image and/or status updated successfully");
            } else {
                res.status(200).send(self.createResponse({}, {
                    success: false,
                    message: "Image and status not updated"
                }));
                console.log("Image and status not updated");
            }
        });
    },
    getUserDetails: function(req, res, next) {
        req.body.userid = req.headers.userid;
        var self = this;
        //UserModel.setDB(req.db);
        UserModel.getUserDetails(req.body, function(err, results) {
            if (err) {
                res.status(400).send(
                        self.createResponse({}, {
                    success: false,
                    message: err.message
                }));
                return false;
            }
            if (results.length > 0) {

                res.status(200).send(self.createResponse(results[0], {
                    success: true,
                    message: "User details fetched successfully...."
                }));
                console.log("User details fetched successfully....");
            } else {
                res.status(200).send(self.createResponse({}, {
                    success: false,
                    message: "User details cannot be fetched.."
                }));
                console.log("User details cannot be fetched..");
            }
        });
    },
    isAccountAvailable: function(req, res, next) {
        var self = this;
        // validate 
        if (!UserModel.validate(req, res, {
            fbId: true,
            device_token: true,
            device_type: true
        })) {
            return false;
        }
        var data = {
            id: req.body.fb_id,
            email_id: req.body.email
        }
        UserModel.isFbIdAvailable(data, function(err, result) {
            if (err) {
                res.status(400).send(
                        self.createResponse({}, {
                    success: false,
                    message: err.message
                }));
                return false;
                console.log(err.message);
            } else {
                if (result.length > 0) {
                    if (result[0].isActive == 1) {
                        var dataCheck = {};
                        dataCheck.user_id = result[0].id;
                        dataCheck.device_type = req.body.device_type;
                        dataCheck.device_token = req.body_device_token;
                        UserSessionModel.createSessionToken(dataCheck, function(err, result2, token) {
                            if (err) {
                                res.status(400).send(
                                        self.createResponse({}, {
                                    success: false,
                                    message: err.message
                                }));
                                console.log(err.message);
                                return false;
                            } else {
                                result[0].device_type = req.body.device_type;
                                result[0].device_token = req.body.device_token;
                                UserModel.updateUserLogin(result[0], function(err, result1) {
                                    res.status(200).send(
                                            self.createResponse({}, {
                                        success: true,
                                        isActive: 1,
                                        message: "Account is active",
                                        data: {
                                            userid: result[0].id,
                                            isFirstLogin: !result[0].isFirstLogin,
                                            user_token: token
                                        }
                                    })
                                            )
                                });
                            }
                        });
                    }
                    else {
                        res.status(200).send(
                                self.createResponse({}, {
                            success: true,
                            isActive: 0,
                            message: "Account is Inactive"
                        }));
                    }
                }
                else {
                    res.status(200).send(
                            self.createResponse({}, {
                        success: false,
                        message: "ID not exists"
                    }));
                }
            }
        });
        console.log("CONTROLLER ENDS HERE");
    },
    logout: function(req, res, next) {
        var user_id = req.headers.userid;
        var self = this;
        UserModel.logout(user_id, function(err, result) {
            if (err) {
                res.status(400).send(
                        self.createResponse({}, {
                    success: false,
                    message: err.message
                }));
                return false;
            }
            res.status(200).send(
                    self.createResponse({}, {
                success: true,
                message: "successfully logged out"
            })
                    );
        });
    },
    uploadUserImage: function(req, res) {


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

        var bitmap = new Buffer(req.body.profile_pic, 'base64');
        fs.writeFile(image, bitmap, function(err) {
            if (err) {

                //callback(err);
            } else {
                var bodyStream = fs.createReadStream(image);
                var params = {Bucket: 'orbmitranscoder', Key: "users/" + image, Body: bodyStream, ACL: 'public-read'};
                s3.putObject(params, function(err, dataa) {
                    path = "http://orbmitranscoder.s3.amazonaws.com/users/" + image;
                    console.log(path);
                    fs.unlink(image, function(err) {
                        if (err) {
                            console.log(err);
                        }
                        console.log("deleted file");
                    });
                    //callback(err, path);
                });
            }
        });
    },
});
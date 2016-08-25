var AWS = require('aws-sdk');
var Model = require("./BaseModel");
var md5 = require('md5');
var config = require('../config')();
var fs = require('fs');
model = new Model();

var UserModel = model
        .extend({

        	/*validate: function (data, res, rules) {
                if (rules.name) {
                    data.checkBody('name', 'Name is required').notEmpty();
                }
                if (rules.email) {
                    data.checkBody('email', 'Email is required').notEmpty();
                    data.checkBody('email', 'Invalid Email').isEmail();
                }
                if (rules.password) {
                    data.checkBody('password', 'Password is required').notEmpty();

                }
                if (rules.device_type) {
                    data.checkBody('device_type', 'Device Type is required')
                            .notEmpty();
                }
                if (rules.user_status) {
                    data.checkBody('user_status', 'User Status is required').optional();
                    data.checkBody('user_status', '2 to 30 characters required').len(2, 30).optional();
                }
                if (rules.profile_pic) {
                    data.checkBody('profile_pic', 'image is required').optional();
                }
                if (rules.registration_type) {
                    data.checkBody('registration_type', 'Registration type is required').notEmpty();
                }
                if (rules.fb_access_token) {
                    data.checkBody('fb_access_token', 'Facebook token is required').optional();
                }
                if (rules.device_token) {
                    data.checkBody('device_token', 'Device token is required').optional();
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
            },*/

            userContacts: function (data, callback){

            	var self = this;

            	var query = self.db.query('SELECT * FROM user_contacts where user_id = ?', [data.userid],
                                function (err, result, fields) {
                                    callback(err, result);
                                });
            }

		});
module.exports = UserModel;

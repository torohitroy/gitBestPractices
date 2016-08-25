var BaseController = require("./BaseController");
var UserModel = new (require("../models/UserModel"));
var UserSessionModel = new (require("./../models/UserSessionModel"));
var LocationModel = new (require("../models/LocationModel"));
var InvitationModel = new (require("../models/InvitationModel"));
var UserContactModel = new (require("../models/UserContactModel"));
var config = require('../config')();
var View = require("../views/Base");
var common = require('../libcustom/common');
var _ = require("underscore");
var nodemailer = require('nodemailer');
//var transporter = nodemailer.createTransport({
//    service: 'Gmail',
//    auth: {
//        user: 'justorbmi@gmail.com', // Your email id
//        pass: 'justorbmi123' // Your password
//    }
//});
module.exports = BaseController.extend({
    name: "invitation",
    content: null,
    sendFriendRequesttemp: function (req, res, next) {

        req.body.userid = req.headers.userid;
        var self = this;
        UserModel.setDB(req.db);
        InvitationModel.setDB(req.db);
        if (!InvitationModel.validate(req, res, {
            email: true,
            contact_method: true
        })) {
            return false;
        }
        UserModel.checkIfUserRegistered(req.body, function (err, results) {

            if (results.length > 0) {
                InvitationModel.alreadyFriends(req.body, function (err, results) {
                    if (results.length > 0) {
                        res.status(200).send(self.createResponse({}, {
                            success: true,
                            message: "You are already friend with this person"
                        }));
                        console.log("You are already friend with this person");
                    } else {
                        InvitationModel.requestAlreadySent(req.body, function (err, results) {
                            if (results.length > 0) {
                                res.status(200).send(self.createResponse({}, {
                                    success: true,
                                    message: "Friend request already sent"
                                }));
                                console.log("Friend request already sent")
                            } else {
                                InvitationModel.sendFriendRequest(req.body, function (err, results) {
                                    if (results.affectedRows > 0) {
                                        res.status(200).send(self.createResponse({}, {
                                            success: true,
                                            message: "Friend request sent successfully"
                                        }));
                                        console.log("Friend request sent successfully");
                                    }
                                    else {
                                        res.status(499).send(self.createResponse({}, {
                                            success: false,
                                            message: "Friend request not sent"
                                        }));
                                        console.log("Friend request not sent");
                                    }
                                });
                            }
                        });
                    }
                });
            }
            else
            {
                // send email
                res.send({"message": "mail to be sent...user not registered"})
                console.log("not registered")
            }
        });
    },
    getFriendRequests: function (req, res, next) {

        var self = this;
        UserModel.setDB(req.db);
        InvitationModel.setDB(req.db);
        req.body.userid = req.headers.userid;
        InvitationModel.getFriendRequests(req.body, function (err, result) {
            if (result.length > 0) {
                res.status(200).send(self.createResponse(result, {
                    success: true,
                    message: "User requests fetched successfully"
                }));
                console.log("User requests fetched successfully");
            } else {
                res.status(499).send(self.createResponse({}, {
                    success: false,
                    message: "No user Requests....\n "
                }));
                console.log("No user requests......\n ");
            }
        });
    },
    getPendingRequest: function (req, res, next) {

        var self = this;
        //UserModel.setDB(req.db);
        //InvitationModel.setDB(req.db);
        req.body.userid = req.headers.userid;
        InvitationModel.getPendingRequest(req.body, function (err, result) {
            if (err) {
                    res.status(400).send(
                        self.createResponse({}, {
                            success: false,
                            message: err.message
                        }));
                    return false;
                }
            if (result.length > 0) {
                res.status(200).send(self.createResponse(result,
                        {
                            success: true,
                            message: "User pending request fetched successfully"
                        }));
            } else {
                res.status(499).send(self.createResponse({}, {
                    success: false,
                    message: "There are no pending request"
                }));
                console.log("There are no pending request");
            }
        });
    },
    getSentFriendRequests: function (req, res, next) {
        var self = this;
        //UserModel.setDB(req.db);
        //InvitationModel.setDB(req.db);
        req.body.userid = req.headers.userid;
        InvitationModel.getSentFriendRequests(req.body, function (err, result) {
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
                    message: "User requests fetched successfully"
                }));
            } else {
                res.status(200).send(self.createResponse({}, {
                    success: true,
                    message: "You have no pending requests"
                }));
            }
        });
    },
    getReceivedFriendRequests: function (req, res, next) {

        var self = this;
        //UserModel.setDB(req.db);
        //InvitationModel.setDB(req.db);
        req.body.userid = req.headers.userid;

            InvitationModel.getReceivedFriendRequests(req.body, function (err, result) {
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
                        message: "User requests fetched successfully"
                    }));
                    console.log("User requests fetched successfully");
                } else {
                    res.status(200).send(self.createResponse({}, {
                        success: true,
                        message: "You have no pending requests"
                    }));
                    console.log("No user requests");
                }
            });
    },
    getFriends: function (req, res, next) {
    var self = this;
    //UserModel.setDB(req.db);
    //InvitationModel.setDB(req.db);
    req.body.userid = req.headers.userid;
    Array.prototype.getIndexByValue = function (name, value) {
            for (var i = 0; i < this.length; i++) {
                if (this[i][name] === value) {
                    return i;
                }
            }
            return -1;
    }
    InvitationModel.getFriends(req.body, function (err, results) {
        if (err) {
            res.status(400).send(
                self.createResponse({}, {
                    success: false,
                    message: err.message
                }));
            return false;
        }
        if (results.length > 0) {

            //console.log(results)
            var arr = [];
            var locations=[];
            for (var prop = 0; prop < results.length; prop++) {
                if (arr.length === 0) {
                    if(results[prop].location_id !== undefined && results[prop].location_id !== null) {
                        locations.push({ loc_id :results[prop].location_id , location :results[prop].location });
                    }
                    arr.push(
                        {
                            user_id: results[prop].user_id,
                            request_status: results[prop].request_status,
                            username: results[prop].username,
                            email:results[prop].email,
                            profile_pic: results[prop].profile_pic,
                            user_status: results[prop].user_status,
                            locations: locations 
                        }
                    )
                }

                else if (arr[arr.getIndexByValue("user_id", results[prop].user_id)] !== undefined && results[prop].location_id !== undefined && results[prop].location_id !== null) {

                    for (var i = 0; i < arr.length; i++) {
                        if (results[prop].user_id === arr[i].user_id) {
                            arr[i].locations.push({loc_id: results[prop].location_id, location: results[prop].location});
                        }
                    }
                }
                else {
                    var locationsnew=[];
                    if(results[prop].location_id !== undefined && results[prop].location_id !== null) {
                        console.log("inside"+results[prop].location_id);
                        locationsnew.push({ loc_id :results[prop].location_id , location :results[prop].location });
                    }
                    arr.push({
                        //id: results[prop].id,
                        user_id: results[prop].user_id,
                        request_status: results[prop].request_status,
                        username: results[prop].username,
                        email:results[prop].email,
                        profile_pic: results[prop].profile_pic,
                        user_status: results[prop].user_status,
                        locations:  locationsnew
                    });
                }
            }
            res.status(200).send(self.createResponse(arr, {
                success: true,
                message: "User requests fetched successfully"
            }));
        }
        else {
            res.status(200).send(self.createResponse({}, {
                success: true,
                message: "No user found."
            }));
            console.log("No user requests");
        }
    });
},
    AcceptOrDenyRequestLatest: function (req, res, next) {
        var self = this;
       // UserModel.setDB(req.db);
        //InvitationModel.setDB(req.db);
        //InvitationModel.setDB(req.db);
        req.body.userid = req.headers.userid;
        req.body.friend_id=req.body.invitation_id;
        if (req.body.request_status === 'A') {
            console.log("inside accept case");
            InvitationModel.AcceptOrDenyRequest(req.body, function (err, result) {
                if (err) {
                    res.status(400).send(
                        self.createResponse({}, {
                            success: false,
                            message: err.message
                        }));
                    return false;
                }
                
                if (result.affectedRows > 0) {
                    res.status(200).send(self.createResponse({}, {
                        success: true,
                        message: "Request Status updated successfully"
                    }));
                    console.log("Request Status updated successfully");
                } else {
                    res.status(499).send(self.createResponse({}, {
                        success: false,
                        message: "Request Status cannot be updated.\n "
                    }));
                    console.log("Request Status cannot be updated\n ");
                }
            });
        }
        else if (req.body.request_status === 'R') {
            console.log("inside reject case");
            InvitationModel.deleteRequest(req.body, function (err, results) {
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
                        message: "Request Status updated successfully"
                    }));
                    console.log("Request Status updated successfully");
                } else {
                    res.status(499).send(self.createResponse({}, {
                        success: false,
                        message: "Request Status cannot be updated.\n "
                    }));
                    console.log("Request Status cannot be updated\n ");
                }
            });
        }
    },
    AcceptOrDenyRequest: function (req, res, next) {

        var self = this;
        UserModel.setDB(req.db);
        InvitationModel.setDB(req.db);
        InvitationModel.setDB(req.db);
        if (!InvitationModel.validate(req, res, {
            friend_id: true,
            request_status: true
        })) {
            return false;
        }
    //console.log(req.headers.userid);
        req.body.userid = req.headers.userid;
        if (req.body.request_status === 'A') {
            console.log("inside accept case");
            InvitationModel.AcceptOrDenyRequest(req.body, function (err, result) {
                if (result.affectedRows > 0) {
                    res.status(200).send(self.createResponse({}, {
                        success: true,
                        message: "Request Status updated successfully"
                    }));
                    console.log("Request Status updated successfully");
                } else {
                    res.status(499).send(self.createResponse({}, {
                        success: false,
                        message: "Request Status cannot be updated.\n "
                    }));
                    console.log("Request Status cannot be updated\n ");
                }
            });
        }
        else if (req.body.request_status === 'R') {
            console.log("inside reject case");
            InvitationModel.deleteRequest(req.body, function (err, results) {
                if (results.affectedRows > 0) {
                    res.status(200).send(self.createResponse({}, {
                        success: true,
                        message: "Request Status updated successfully"
                    }));
                    console.log("Request Status updated successfully");
                } else {
                    res.status(499).send(self.createResponse({}, {
                        success: false,
                        message: "Request Status cannot be updated.\n "
                    }));
                    console.log("Request Status cannot be updated\n ");
                }
            });
        }
    },
    getContacts: function (req, res, next) {

        var self = this;
        UserModel.setDB(req.db);
        InvitationModel.setDB(req.db);
        req.body.userid = req.headers.userid;
        var i = 0;
        Array.prototype.getIndexBy = function (name, value) {
            for (var i = 0; i < this.length; i++) {
                if (this[i][name] === value) {
                    return i;
                }
            }
            return -1;
        }
        InvitationModel.getContacts(req.body, function (err, results) {
            if (err) {
                res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                return false;
                }
            if (results.length > 0) {

                console.log(results)
                var arr = [];
                for (var prop = 0; prop < results.length; prop++) {
                    if (arr.length === 0) {
                        console.log("first if");
                        arr.push({id: results[prop].id,
                            user_id: results[prop].user_id,
                            email: results[prop].email,
                            request_status: results[prop].request_status,
                            receivers_id: results[prop].receivers_id,
                            username: results[prop].username,
                            profile_pic: results[prop].profile_pic,
                            locations: [{loc_id: results[prop].loc_id, location: results[prop].location}]})
                    }

                    else if (arr[arr.getIndexBy("id", results[prop].id)] !== undefined) {
                        console.log("inside else if")
                        for (i = 0; i < arr.length; i++) {
                            if (results[prop].id === arr[i].id) {
                                arr[i].locations.push({loc_id: results[prop].loc_id, location: results[prop].location});
                            }
                        }

                    }
                    else {
                        console.log("last else");
                        arr.push({id: results[prop].id,
                            user_id: results[prop].user_id,
                            email: results[prop].email,
                            request_status: results[prop].request_status,
                            receivers_id: results[prop].receivers_id,
                            username: results[prop].username,
                            profile_pic: results[prop].profile_pic,
                            locations: [{loc_id: results[prop].loc_id, location: results[prop].location}]});
                    }
                }
                res.status(200).send(self.createResponse(arr, {
                    success: true,
                    message: "User contacts fetched successfully"
                }));
            } else {
                res.status(499).send(self.createResponse({}, {
                    success: false,
                    message: "No contacts "
                }));
                console.log("No contacts ");
            }
        });
    },

    sendRequestMethod: function (req, res, next){
        var self = this;
        var receiver_email = req.body.email;
        var sender_id = req.headers.userid;
        var token = req.headers.token;
        var inviteData = {
            sender_id: sender_id,
            receiver_email: receiver_email,
            receiver_id: null,
            request_status: 'P'
        };
        if (!InvitationModel.validate(req, res, {
            email: true
        })) {
            return false;
        }
        var myval = '';
        UserModel.showusername(req.headers.userid, function (err, result){
            if (err) {
                res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                return false;
            }
            
            if(!result || result.length == 0){
                myval="No User";
            }else{
                myval=result[0].username;
            }
            
            UserModel.checkIfUserRegistered(req.body, function (err, results) {
                if(results.length > 0){
                    //User exists in Orb
                    var data = {};
                    data.sender_id = sender_id;
                    data.receiver_id = results[0].id;
                    var device_token = results[0].device_token;
                    if(data.sender_id==data.receiver_id){
                        res.status(200).send(self.createResponse({}, {
                            success: false,
                            message: "Same User Friend Request Not Send"
                        }));
                    }else {
                        InvitationModel.checkAlreadySentRequests(data, function (err, result) {
                            if (result.length > 0) {
                                //request already sent
                                if (result[0].request_status == 'P') {
                                    res.status(200).send(self.createResponse({}, {
                                        success: false,
                                        message: "A request already sent or received from the user."
                                    }));
                                }

                                else if (result[0].request_status == 'A') {
                                    res.status(200).send(self.createResponse({}, {
                                        success: false,
                                        message: "User already in orbit"
                                    }));
                                }
                            }
                            else {
                                inviteData.receiver_id = data.receiver_id;
                                InvitationModel.sendInvite(inviteData, function (err, result) {
                                    if (err) {
                                        console.log(err.message);
                                            res.status(400).send(
                                                self.createResponse({}, {
                                                    success: false,
                                                    message: err.message
                                                }));
                                            return false;
                                            
                                    } else {
                                        if (device_token) {
                                            var message = {
                                                data: { FRIEND_REQUEST: 'FRIEND_REQUEST', MESSAGE: 'You have new friend request' }
                                            };
                                             message.notification = {
                                                title: 'Friend Request',
                                                body: 'You have new friend request',
                                                sound: 'default'
                                            };
                                            common.send_push(message, [device_token]);
                                        }
                                        res.status(200).send(self.createResponse({}, {
                                            success: true,
                                            message: "Friend request sent"
                                        }));
                                    }
                                });
                            }
                       });
                    }
                }else{
                    var link="download_app";
                    var timeInMss = Date.now();
                    var hstname=config.server_details.host;
                    var data="Hi There!<br />";
                    console.log(myval);
                    var data2=" has invited you to download the OrbMi app! OrbMi is a private voice messaging network between you and your closest friends and family. Users can create geo-fenced locations to receive messages in, and will only receive their messages when they are in these locations. Thus, you can communicate freely with your friends and family knowing that you won't be interrupting them in any way.";
                    data+= '<p>'+ myval+data2+'</p><br /><p>Download OrbMi here: </p><a href="http://'+hstname+link + '">http://'+hstname+link +'</a>';
                    data+="<br /><br />Thanks";
                    data+="<br />The OrbMi Team";
                    //var data='hello friend';
                    var transporter = nodemailer.createTransport(config.email_config);
                    var mailOptions = {
                        from: '"Orb" ' + config.email_details.username,
                        to: req.body.email,
                        subject: 'Invitation to install OrbMi App',
                        text: "Orb",
                        date:timeInMss,
                        html: data
                    };
                    transporter.sendMail(mailOptions, function(error, info){
                        if(error){
                            //user not exists in Orb
                            res.status(200).send(self.createResponse({}, {
                                success: false,
                                message: "email does not exist"
                            }));
                            return console.log(error);
                        }else{
                            
                            InvitationModel.sendInvite(inviteData, function (err, result) {
                                if (err) {
                                    console.log(err.message);
                                        res.status(400).send(
                                            self.createResponse({}, {
                                                success: false,
                                                message: err.message
                                            }));
                                        return false;
                                        
                                } else {
                                    
                                    // console.log('innner');
                                    res.status(200).send(self.createResponse({}, {
                                        success: true,
                                        message: "Invite sent"
                                    }));
                                }
                            });
                        }
                    });
                }
            });
        });
    },
    sendFriendRequest: function (req, res, next) {

        req.body.userid = req.headers.userid;
        var self = this;
        //UserModel.setDB(req.db);
        //InvitationModel.setDB(req.db);
        if (!InvitationModel.validate(req, res, {
            email: true,
            contact_method: true
        })) {
            return false;
        }
        UserModel.checkIfUserRegistered(req.body, function (err, results) {
            if (err) {
                res.status(400).send(
                    self.createResponse({}, {
                        success: false,
                        message: err.message
                    }));
                return false;
            }

            if (results.length > 0) {
                InvitationModel.getThisField({field: 'id', prop: 'email', value: req.body.email},
                    function (err, user) {

                    if (user.length > 0) {

                        req.body.id = user[0].id;
                        InvitationModel.alreadyFriends(req.body, function (err, results) {
                            if (err) {
                                res.status(400).send(self.createResponse({}, {
                                    success: false,
                                    messgage: err.message
                                }));
                                return false;
                            }
                            if (results.length > 0) {
                                res.status(200).send(self.createResponse({}, {
                                    success: true,
                                    message: "You are already friend with this person"
                                }));
                                console.log("You are already friend with this person");
                            } else {
                                InvitationModel.requestAlreadySent(req.body, function (err, results) {
                                    if (err) {
                                        res.status(400).send(self.createResponse({}, {
                                            success: false,
                                            messgage: err.message
                                        }));
                                        return false;
                                    }
                                    if (results.length > 0) {
                                        res.status(200).send(self.createResponse({}, {
                                            success: true,
                                            message: "Friend request already sent"
                                        }));
                                        console.log("Friend request already sent")
                                    } else {
                                        InvitationModel.sendFriendRequest(req.body, function (err, results) {
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
                                                    message: "Friend request sent successfully"
                                                }));
                                                console.log("Friend request sent successfully");
                                            }
                                            else {
                                                res.status(499).send(self.createResponse({}, {
                                                    success: false,
                                                    message: "Friend request not sent"
                                                }));
                                                console.log("Friend request not sent");
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
            else
            {  //send mail..user not registered
                InvitationModel.getThisField({field: 'username', prop: 'email', value: req.body.user_email}, function (err, user) {
                    if (err) {
                        res.status(400).send(
                            self.createResponse({}, {
                                success: false,
                                message: err.message
                            }));
                        return false;
                    }
                    if (user.length > 0) {
                        res.mailer.send('email', {
                            to: req.body.email, // This can be a comma delimited string just like a normal email to field. 
                            subject: 'Invitation to install OrbMi App', // REQUIRED.
                            details: user // All additional properties are also passed to the template as local variables.
                        }, function (err) {
                            if (err) {
                                // handle error
                                console.log(err);
                                res.send('There was an error sending the email');
                                return;
                            }
                            res.status(200).send(self.createResponse({}, {
                                success: true,
                                message: "invitation sent successfully"
                            }));
                            console.log("invitation sent successfully");
                        });
                    }
                    else {
                        console.log("usernme cnt be fetched")
                    }
                })


            }
        });
    }
});

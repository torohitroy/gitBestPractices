var express = require('express');
var router = express.Router();
var BaseController = require("./../controllers/BaseController");
var UserController = require("./../controllers/UserController");
var LocationController = require("./../controllers/LocationController");
var InvitationController = require("./../controllers/InvitationController");
var MessageController = require("./../controllers/MessageController");

var validateUser = function (req, res, next) {
    BaseController.validateUser(req, res, next);
}


router.get('/confirm_email/:token', function(req,res,next){
    UserController.email_verification(req, res, next);

});

router.get('/download_app', function(req,res,next){
    UserController.download_app(req, res, next);
});

router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

router.post('/api/v1/sendForgotPasswordEmail', function (req, res, next) {
    UserController.forgotPasswordEmail(req, res, next);
});

router.get('/api/v1/regeneratePassword/:id', function (req, res, next) {
    UserController.regeneratePassword(req, res, next);
});

router.post('/api/v1/resetPassword', function (req, res, next) {
    UserController.resetPassword(req, res, next);
});

router.post('/api/v1/registerUsers/Registration', function (req, res, next) {
    UserController.register(req, res, next);
});

router.post('/login', function (req, res, next) {
    UserController.login(req,res,next);
});

router.post('/api/v1/registerUsers/login', function (req, res, next) {
    UserController.login(req, res, next);
});

router.post('/api/v1/registerUsers/updateSettings',validateUser, function (req, res, next) {
    UserController.updateSettings(req, res, next);
});

router.post('/api/v1/friendRequest/sendFriendRequest',validateUser, function (req, res, next) {
    InvitationController.sendRequestMethod(req, res, next);
});

router.get('/api/v1/getFriends',validateUser, function (req, res, next) {
    InvitationController.getFriends(req, res, next);
});

router.get('/api/v1/message/viewMessageHistory', function (req, res, next) {
    MessageController.viewMessageHistory(req, res, next);
});

router.post('/api/v1/message/deleteMessage',validateUser, function (req, res, next) {
    MessageController.deleteMessage(req, res, next);
});

router.put('/api/v1/message/favouriteMessage', function (req, res, next) {
    MessageController.favoriteMessage(req, res, next);
});

router.get('/api/v1/friendRequest/getPendingRequest', function (req, res, next) {
    InvitationController.getPendingRequest(req, res, next);
});

router.post('/api/v1/friendRequest/getContacts', function (req, res, next) {
    InvitationController.getContacts(req, res, next);
});

router.put('/api/v1/friendRequest/getFriendRequests',validateUser, function (req, res, next) {
    InvitationController.getFriendRequests(req, res, next);
});

router.get('/api/v1/friendRequest/getSentFriendRequests',validateUser, function (req, res, next) {
    InvitationController.getSentFriendRequests(req, res, next);
});


router.get('/api/v1/friendRequest/getReceivedFriendRequests',validateUser, function (req, res, next) {
    InvitationController.getReceivedFriendRequests(req, res, next);
});

router.post('/api/v1/friendRequest/AcceptDenyRequest',validateUser ,function (req, res, next) {
    InvitationController.AcceptOrDenyRequestLatest(req, res, next);
});

router.post('/api/v1/location/addLocation', validateUser, function (req, res, next) {
    LocationController.addLocation(req, res, next);
});

router.post('/api/v1/location/updateLocation', validateUser, function (req, res, next) {
    LocationController.updateLocation(req, res, next);
});

router.post('/api/v1/location/deleteLocation', validateUser, function (req, res, next) {
    LocationController.deleteLocation(req, res, next);
});

router.put('/api/v1/location/locationExists', validateUser, function (req, res, next) {
    LocationController.IflocationExists(req, res, next);
});

router.get('/api/v1/location', validateUser, function (req, res, next) {
    LocationController.getLocation(req, res, next);
});

router.get('/api/v1/registerUsers/userDetails', function (req, res, next) {
    UserController.getUserDetails(req, res, next);
});

router.post('/api/v1/isAccountAvailable', function (req, res, next) {
    UserController.isAccountAvailable(req, res, next);
});

router.put('/api/v1/setuserimage', function (req, res, next) {
    UserController.setUserImage(req, res, next);
});

router.post('/api/v1/message/sendMessages',validateUser, function (req, res, next) {
    MessageController.sendMessageLast(req, res, next);
});

router.get('/api/v1/message/getMessages/:page', validateUser, function (req, res, next) {
    MessageController.getMessagesNew(req, res, next);
    //location_time
});

router.post('/api/v1/message/updateReadFlag', validateUser, function (req, res, next) {  
    MessageController.updateReadFlag(req, res, next);
});

router.get('/api/v1/message/getSentMessages/:page',validateUser, function (req, res, next) {  
    MessageController.getSentMessages(req, res, next);
});

router.put('/api/v1/registerUsers/updateDeviceToken', function (req, res, next) {  
    UserController.updateDeviceToken(req, res, next);
});

router.put('/api/v1/video', function (req, res, next) {  
    MessageController.convertMessage(req, res, next);
});

router.get('/api/v1/getFriendRequestsAgain', function (req, res, next) {  
    InvitationController.getFriendRequestsAgain(req, res, next);
});
router.get('/api/v1/logout', function (req, res, next) {  
    UserController.logout(req, res, next);
});
router.post('/api/v1/check_user_location',validateUser, function(req, res, next){
    LocationController.checkUserLocation(req,res,next);
});

module.exports = router;
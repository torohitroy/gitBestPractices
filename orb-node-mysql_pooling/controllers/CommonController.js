/*
 * Common Controller
 */

var BaseController = require("./BaseController"), UserModel = new (require("../models/UserModel"));
UserSessionModel = new (require("../models/UserSessionModel"));

module.exports = BaseController.extend({

	name : "common",
	content : null,

	checkIdandToken : function(req, res, next) {
		
		console.log("Checking Id and Token...\n");
		
		// Check if userid and Token are set in header
		if ((req.headers.token == undefined)
				|| (req.headers.userid == undefined)) {
			res.status(401).send({
				success : false,
				message : "UserId or Token is missing"
			});
			console.log("UserId or Token is missing. Exiting Common controller...\n");
			return false;
		}

		var self = this;

		// If user exists create user token in table
		UserSessionModel.setDB(req.db);
		UserSessionModel.checkIdandToken(req.headers, function(err, result) {

			// userid and token is not valid then send response to server
			// telling invalid credentials
			if (result.length == 0) {
				res.status(401).send(self.createResponse({}, {
					success : false,
					message : "User Id or Token is invalid"
				}));
				console.log("UserId or Token is invalid. Exiting Common controller...\n");
			} else {
				// else send control to next middleware
				console.log("User is valid. Now moving for next middleware...\n");
				next();
			}
		});
	}
});
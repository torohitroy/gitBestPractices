var assert = require("assert");
describe("Configuration setup", function() {
	it("should load local configurations", function(next) {
		var config = require('../config')();
		assert.equal('development', config.mode);
		next();
	});
	it("should load staging configurations", function(next) {
		var config = require('../config')('staging');
		assert.equal('staging', config.mode);
		next();
	});
	it("should load production configurations", function(next) {
		var config = require('../config')('production');
		assert.equal('production', config.mode);
		next();
	});
});

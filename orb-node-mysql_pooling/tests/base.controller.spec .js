var BaseController = require("../controllers/BaseController");

var chai = require('chai')
, expect = chai.expect
, should = chai.should();

describe("Base controller", function() {
	it("should have a method extend which returns a child instance", function(
			next) {
		should.exist(BaseController.extend);
		var child = BaseController.extend({
			name : "my child controller"
		});
		
		should.exist(child.run);
		expect(child.name).to.equal("my child controller");
		next();
	});
	it("should be able to create different childs", function(next) {
		var childA = BaseController.extend({
			name : "child A",
			customProperty : 'value'
		});
		var childB = BaseController.extend({
			name : "child B"
		});
		expect(childA.name).not.to.equal(childB.name);
		should.not.exist(childB.customProperty);
		next();
	});
});
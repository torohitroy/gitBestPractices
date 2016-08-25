
module.exports = function(){
    this.db = require('../config/mysql_pool');
}

module.exports.prototype = {
    extend: function (properties) {
        var Child = function (db) {
            this.db = db;
        };
        Child.prototype = new module.exports();
        for (var key in properties) {
            Child.prototype[key] = properties[key];
        }
        return Child;
    },
    setDB: function (db) {
        this.db = db;
    },
    
    /**
     * @todo: to be removed once all the models are fixed.
     */
    createResponse: function (data, status) {
        var ob = {};
        if (!_generic.isEmpty(data)) ob.data = data;
        ob.status = status;
        return ob;
    }
}
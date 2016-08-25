var express = require('express');
var router = express.Router();
var Controller = require("./../controllers/UserController");

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/api/v1/registerUsers/memberRegistration', function(req, res, next) {
          Controller.register(req,res,next)  
        });

router.get('/hello',function(req,res,next) {
	res.send("hello world")
})

/*router.post('/api/v1/registerUsers/memberRegistration', attachDB , function(req, res, next) {
            
        });

router.post('/api/v1/registerUsers/login', attachDB , function(req, res, next) {
            
        }); 



router.post('/api/v1/registerUsers/setUserStatus', attachDB , function(req, res, next) {
            
        });  */


module.exports = router;

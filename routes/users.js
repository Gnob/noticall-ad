var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signin', function(req, res) {
    var usermail = req.body.usermail, pw = req.body.pw;
    console.log(req.is('json'));// + ' / ' + pw);
});

module.exports = router;

var express = require('express');
var router = express.Router();

router.get('/:path', function(req, res, next) {
    res.send('Sending file : ' + req.params.path);
});

module.exports = router;

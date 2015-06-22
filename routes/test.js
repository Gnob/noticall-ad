var express = require('express');
var router = express.Router();

router.get('/insert', function(req, res, next) {
    var user = {
        'username': 'Tester',
        'mail': 'test@test.com',
        'pw': 'testtest'
    };

    var query = req.app.locals.connection.query('INSERT INTO advertiser SET ?', user, function(err, result) {
        if (err) {
            console.error(err);
            throw err;
        }

        console.log(query);
        console.log('\n');
        console.log(result);
        res.status(200).send('success');
    });
});


router.get('/select', function(req, res, next) {
    var query = req.app.locals.connection.query('SELECT * FROM advertiser', function(err, rows){
        console.log(rows);
        res.json(rows);
    });

    console.log(query);
});


router.get('/where', function(req, res, next) {
    var query = req.app.locals.connection.query('SELECT * FROM advertiser where username='
            + req.app.locals.mysql_escape(req.query.username), function(err, rows) {
        console.log(rows);
        res.json(rows);
    });
});

module.exports = router;

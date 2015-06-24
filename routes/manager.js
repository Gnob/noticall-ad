var express = require('express');
var async = require('async');
var query = require('./query');
var router = express.Router();

function checkSuper(req, res, next) {
    console.log('middleware');
    if (req.mySession.isSuper) {
        return next();
    }

    res.redirect('/signin');
}


router.get('/allow/:itemId', checkSuper, function(req, res, next) {
    var pool = req.app.locals.pool;

    query.allowItem(pool, req.params.itemId, 0, function(err) {
        try {
            if (err) {
                throw err;
            }

            res.send('Update!');
        } catch (ex) {
            console.error(ex);
            if (ex.name == 'NotExistItem') {
                res.json({ msg: ex.message });
            } else {
                res.json(ex.message);
            }
        }
    });
});


router.get('/super/:username', checkSuper, function(req, res) {
    var TAG = '[/super]';

    var pool = req.app.locals.pool;

    query.giveSuper(pool, req.params.username, 0, function(err) {
        try {
            if (err) {
                throw err;
            }

            res.send('Update!');
        } catch (ex) {
            console.error(ex);
            if (ex.name == 'NotExistUser') {
                res.json({ msg: ex.message });
            } else {
                res.json(ex.message);
            }
        }
    });
});


module.exports = router;

var express = require('express');
var async = require('async');
var query = require('./query');
var router = express.Router();

function checkSuper(req, res, next) {
    console.log('middleware in manager');
    console.log(req.mySession.isSuper);
    console.log(req.get('Superuser'))
    if (req.mySession.token == req.get('Authorization') && req.mySession.isSuper == 1) {
        return next();
    }

    var resJson = {
        status: "403",
        message: "관리자 권한이 없습니다."
    };

    console.log(resJson.message);
    res.json(resJson);
}


router.get('/list', checkSuper, function(req, res, next) {
    //res.render('index', { title: 'Express' });
    var TAG = '[SUPER /list]';
    var locs = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

    var pool = req.app.locals.pool;

    query.requestList(pool, null, null, function (err, output) {
        var resJson;

        if (err) {
            console.log(TAG + " ERORR!! requestAllList");
            console.error(err);

            resJson = {
                status:"500",
                message: "오류가 발생했습니다. 다시 시도 해주세요."
            };
        }
        else {
            console.log(TAG + ' Success finish list.');

            resJson = {
                status: "200",
                message: "리스트를 불러왔습니다.",
                data: output
            };
        }

        console.log(resJson.message);
        res.json(resJson);
    });
});


router.post('/chmod', checkSuper, function(req, res, next) {
    var pool = req.app.locals.pool;

    var data = req.body;

    console.log('in chmod');
    console.log(req.body);

    if (data.method == 'allow') {
        query.allowItem(pool, data.item_id, function(err) {
            var resJson;

            if (err) {
                if (err.name && err.name == 'NotExistItem') {
                    resJson = {
                        status: "404",
                        message: "아이템이 존재하지 않습니다."
                    };
                }
                else {
                    resJson = {
                        status:"500",
                        message: "오류가 발생했습니다. 다시 시도 해주세요."
                    };
                }
            }
            else {
                resJson = {
                    status:"200",
                    message: "해당 광고가 승인 되었습니다."
                };
            }

            console.info(resJson.message);
            res.json(resJson);
        });
    }
    else if (data.method == 'disallow') {
        query.disallowItem(pool, data.item_id, data.memo, function(err) {
            var resJson;

            if (err) {
                if (err.name && err.name == 'NotExistItem') {
                    resJson = {
                        status: "404",
                        message: "아이템이 존재하지 않습니다."
                    };
                }
                else {
                    resJson = {
                        status:"500",
                        message: "오류가 발생했습니다. 다시 시도 해주세요."
                    };
                }
            }
            else {
                resJson = {
                    status: "200",
                    message: "해당 광고를 금지시켰습니다."
                };
            }

            console.info(resJson.message);
            res.json(resJson);
        });
    }
    else {

        var resJson = {
            status: "407",
            message: "요청이 올바르지 않습니다."
        };

        console.info(resJson.message);
        res.json(resJson);
    }

});


// router.get('/allow/:itemId/:flag', checkSuper, function(req, res, next) {
//     var pool = req.app.locals.pool;
//     var flag = req.params.flag == 'o' ? true : false;
//
//     query.allowItem(pool, req.params.itemId, flag, function(err) {
//         try {
//             if (err) {
//                 throw err;
//             }
//
//             res.json('Update!');
//         } catch (ex) {
//             console.error(ex);
//             if (ex.name == 'NotExistItem') {
//                 res.json({ msg: ex.message });
//             } else {
//                 res.json(ex.message);
//             }
//         }
//     });
// });


router.get('/super/:username/:flag', function(req, res, next) {
    var TAG = '[/super]';

    var pool = req.app.locals.pool;
    var flag = req.params.flag == 'o' ? true : false;

    query.giveSuper(pool, req.params.username, flag, function(err) {
        try {
            if (err) {
                throw err;
            }

            res.json('Update!');
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

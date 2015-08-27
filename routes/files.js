var express = require('express');
var async = require('async');
var multer  = require('multer');
var query = require('./query');
var fs = require('fs');
var router = express.Router();

router.use(function(req, res, next) {
    console.log('middleware in files');
    console.log(req.path);
    console.log(req.path.indexOf('/down'))
    if (req.mySession.token == req.get('Authorization') || req.path.indexOf('down/')) {

        return next();
    }

    var resJson = {
        status: "408",
        message: "로그인이 되어있지 않습니다. 로그인 해주세요."
    };

    console.log(resJson.message);
    res.json(resJson);
});

// middleware of /upload to set up MULTER with req, res object
router.use('/upload', function(req, res, next) {
    var handler = multer({
        dest: './public/uploads/',
        limits: {
            fieldNameSize: 100,
            fieldSize: 90,
            fileSize: 1024 * 1024 * 1,
            files: 2,
            fields: 4
        },
        includeEmptyFields: false,
        putSingleFilesInArray: true,
        rename: function (fieldname, filename) {
            return filename+Date.now();
        },
        onFileUploadStart: function (file, req, res) {
            console.log("[onFileUploadStart] enter");

            var isMp3 = file.extension == 'mp3';
            var isJpg = file.extension == 'jpg';

            if (!isMp3 && !isJpg) {
                console.log("[onFileUploadStart] extension error");
                if (req.app.locals.invalid_ext) {
                    req.app.locals.invalid_ext = 2;
                } else {
                    req.app.locals.invalid_ext = 1;
                }
                return false;
            }
            else if (isMp3) {
                req.app.locals.isMp3 = isMp3;
            }
            else if (isJpg) {
                req.app.locals.isJpg = isJpg;
            }

            console.log("[onFileUploadStart]" + file.originalname + ' is starting ...');
        },
        onFileUploadComplete: function (file, req, res) {
            console.log("[onFileUploadComplete] " + file.fieldname + ' uploaded to  ' + file.path);
        },
        onFileSizeLimit: function (file) {
            console.log("[onFileSizeLimit] " + 'Failed: ', file.originalname);

            fs.unlink('./' + file.path, function (err) {
                if (err) {
                    console.log(err);
                    console.log("!!!!Error!!!!! is occured but not handling... in file of multer");
                }
                else {
                    console.log('successfully deleted');
                }
            }); // delete the partially written file
        },
        onFilesLimit: function () {
            console.log('[onFilesLimit] Crossed file limit!');
        },
        onParseEnd: function (req, next) {
            console.log('[onParseEnd] Form parsing completed at: ', new Date());

            console.log(req.body);

            // call the next middleware
            next();
        },
        onError: function (error, next) {
            console.log(error)
            next(error)
        }
    });

    handler(req, res, next);
});


// TODO: Upload Cancel 불가능...
router.post('/upload', function(req, res) {
    var TAG = '[/upload]';

    console.log(req.files);

    var mp3_file = req.files.dataSet && req.files.dataSet[0];
    var jpg_file = req.files.dataSet && req.files.dataSet[1];
    var isSizeLimit = (mp3_file && mp3_file.truncated) || (jpg_file && jpg_file.truncated);
    var isValid = req.app.locals.isMp3 && req.app.locals.isJpg && !isSizeLimit;

    var resJson;

    if (req.app.locals.invalid_ext != 2) {
        if (!isValid) {
            var COND = ' INVALID ::';

            console.log(TAG + COND + " Invalid routine start");
            console.log(TAG + COND + " Uploaded file delete routine START");
            if (mp3_file) {
                console.log(mp3_file);
                query.deleteFile(TAG + COND + ' MP3 FILE ::', mp3_file.path);
            }
            if (jpg_file) {
                console.log(jpg_file);
                query.deleteFile(TAG + COND + ' JPG FILE ::', jpg_file.path);
            }
            console.log(TAG + COND + " Uploaded file delete routine END");

            console.log(TAG + COND + " If it is size limit, don't response here.");
            if (isSizeLimit) {
                resJson = {
                    status: "410",
                    message: "크기가 너무 큽니다. 파일의 크기는 1MB 이하로 제한됩니다."
                };
                console.log(TAG + COND + " Invalid routine is finished.");
            }
            else {
                resJson = {
                    status: "411",
                    message: "파일 형식이 올바르지 않습니다."
                };
            }
        }
        else {
            var COND = ' VALID ::';
            if (mp3_file && jpg_file) {
                query.insertItem(TAG + COND, mp3_file, jpg_file, req, res, function (err) {
                    var resJson;

                    if (err) {
                        resJson = {
                            status: "500",
                            message: "오류가 발생했습니다. 다시 시도 해주세요."
                        };
                    }
                    else {
                        resJson = {
                            status: "200",
                            message: "업로드를 성공했습니다."
                        };
                    }

                    console.log(resJson.message);
                    res.json(resJson);
                });
                return;
            }
            else {
                console.log(TAG + COND + " But upload error : " + mp3_file + " / " + jpg_file + " / " + isValid);

                resJson = {
                    status: "500",
                    message: "오류가 발생했습니다. 다시 시도 해주세요."
                };
            }
        }
    }
    else {
        var COND = ' EXTENSION ERROR ::'
        console.log(TAG + COND + " Extension error");

        resJson = {
            status: "411",
            message: "파일 형식이 올바르지 않습니다."
        };
    }

    console.log(resJson.message);
    res.json(resJson);
});


router.get('/down/:type/:id', function(req, res, next) {
    var TAG = '[/down]'
    console.log(TAG + " enter the routine");
    var con;

    var pool = req.app.locals.pool;

    query.requestFile(pool, req.params.type, req.params.id, function(err, file) {
        var resJson;

        if (err) {
            console.log(err);
            console.log(TAG + " ERORR!! requestFile");

            resJson = {
                status:"500",
                message: "오류가 발생했습니다. 다시 시도 해주세요."
            };

            console.info(resJson.message);
            res.json(resJson);
        }
        else if (!file) {
            console.log(TAG + " ERORR!! requestFile");

            resJson = {
                status:"404",
                message: "파일이 존재하지 않습니다."
            };

            console.info(resJson.message);
            res.json(resJson);
        }
        else {
            console.log(TAG + ' Success to get file uri, serve the file to client.');
            res.download(file.uri, file.filename, function (err) {
                if (err) {
                    console.log(TAG + " ERORR!! transfer to download file");

                    resJson = {
                        status:"500",
                        message: "오류가 발생했습니다. 다시 시도 해주세요."
                    };
                }
                console.log(TAG + ' Download finish.');
            });
        }
    });
});


router.get('/view/:type/:id', function(req, res, next) {
    var TAG = '[/view]'
    console.log(TAG + " enter the routine");
    var con;

    var pool = req.app.locals.pool;

    query.requestFile(pool, req.params.type, req.params.id, function(err, file) {
        var resJson;

        if (err) {
            console.log(err);
            console.log(TAG + " ERORR!! requestFile");

            resJson = {
                status:"500",
                message: "오류가 발생했습니다. 다시 시도 해주세요."
            };

            console.info(resJson.message);
            res.json(resJson);
        }
        else if (!file) {
            console.log(TAG + " ERORR!! requestFile");

            resJson = {
                status:"404",
                message: "파일이 존재하지 않습니다."
            };

            console.info(resJson.message);
            res.json(resJson);
        }
        else {
            console.log(TAG + ' Success to get file uri, serve the file to client.');
            res.send('<img src="' + req.app.locals.baseUrl +
            file.uri.replace(/\\/g, '/').replace('public/', './') + '">');
        }
    });
});


router.get('/list', function(req, res, next) {
    var TAG = '[/list]';

    var locs = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

    var pool = req.app.locals.pool;

    query.requestList(pool, 'user_id', req.mySession.user_id, function (err, output) {
        var resJson;

        if (err) {
            console.log(TAG + " ERORR!! requestList");
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


router.get('/downlist/:loc', function(req, res, next) {
    var TAG = '[/list]';

    var locs = {
        11: "서울", 26: "부산", 27: "대구", 28: "인천", 29: "광주", 30: "대전",
        31: "울산", 41: "경기", 42: "강원", 43: "충북", 44: "충남", 45: "전북",
        46: "전남", 47: "경북", 48: "경남", 49: "제주"
    };

    var isValid = (req.params.loc && locs[req.params.loc]) ? true : false;

    if (!isValid) {
        res.status("401").end();
    }
    else {
        var pool = req.app.locals.pool;

        query.requestFilelist(pool, 'location', "'" + locs[req.params.loc] + "'", function (err, output) {
            if (err) {
                if (err.message == "EmptyList") {
                    res.send("0");
                }
                else {
                    console.log(err);
                    console.log(TAG + " ERORR!! requestList");
                    res.status(404).end();
                }
            }
            else {
                console.log(TAG + ' Success finish list.')
                console.log(output)
                // res.render('main', output).end();

                var maxWanted = output.length > 10 ? 10 : output.length;
                console.log(maxWanted);
                var numSet = randomGenerator(output.length, maxWanted);
                //var numSet = [1, 2];
                console.log(numSet);
                var list = numSet.length + "";
                console.log(list);

                for (var i = 0; i < numSet.length; i++) {
                    list += "\n" + output[numSet[i]].list_id;
                    list += "\n" + req.app.locals.baseUrl + "files/down audio " + output[numSet[i]].audio_id;
                    // list += "\n" + req.app.locals.baseUrl + "files/down poster " + output[numSet[i]].poster_id;
                    list += "\n" + req.app.locals.baseUrl + "files/down poster " + output[numSet[i]].poster_id;
                }

                console.log(list);
                res.send(list);
            }
        });
    }
});

function randomGenerator(boundaryN, wantedN) {
    var numSet = [];
    var numHash = {};
    var temp;

    while (numSet.length != wantedN) {
        temp = Math.floor((Math.random() * boundaryN));
        if (!numHash[temp]) {
            numSet.push(temp);
            numHash[temp] = true;
        }
    }

    numHash = null;

    return numSet;
}


// list_id를 참조하자.
router.get('/delete/:listId', function(req, res, next) {
    var TAG = '[/delete]'

    var resJson;

    query.deleteItem(TAG, req, res, function(err) {
        if (err) {
            console.log(err);
            console.log(TAG + 'deleteItem error')

            resJson = {
                status: "500",
                message: "오류가 발생했습니다. 다시 시도 해주세요."
            };
        }
        else {
            console.log(TAG + ' Delete ad_item finish');

            resJson = {
                status: "200",
                message: "삭제에 성공했습니다."
            };
        }
        console.log(resJson.message)
        res.json(resJson);
    });
});


module.exports = router;

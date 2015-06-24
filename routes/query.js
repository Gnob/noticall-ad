var async = require('async');
var fs = require('fs');

function requestList(pool, columm, value, cb) {
    var TAG = "[requestList]";
    var con;

    if (!pool) {
        return cb(new Error("Empty pool..."), 0);
    }

    async.waterfall([
        function(callback) {
            console.log(TAG + " Start in waterfall");
            console.log(TAG + " getConnection()");

            pool.getConnection(callback);
        },
        function(connection, callback) {
            console.log(TAG + " query to get ad_item #1 (SELECT with INNER JOIN)");

            con = connection;

            con.query('SELECT file_list.location, ad_item.*, file_list.audio_id, audio_files.filename AS audio_name, audio_files.down_count AS audio_count, file_list.poster_id From file_list ' +
            'INNER JOIN ad_item ON file_list.list_id = ad_item.list_id ' +
            'INNER JOIN audio_files ON file_list.audio_id = audio_files.file_id ' +
            (columm ? 'WHERE ' + columm + '=' + value : ''), callback);
        },
        function(rows, result, callback) {
            if (rows.length == 0) {
                console.log(TAG + " Empty list");
                con.release();
                return cb(null, []);
            }
            else {
                console.log(TAG + " query to get ad_item #2 (SELECT with INNER JOIN)");

                var output = rows;

                con.query('SELECT poster_files.uri, poster_files.filename AS poster_name, poster_files.down_count AS poster_count From file_list ' +
                'INNER JOIN ad_item ON file_list.list_id = ad_item.list_id ' +
                'INNER JOIN poster_files ON file_list.poster_id = poster_files.file_id ' + (columm ? 'WHERE ' + columm + '=' + value : ''), function(err, rows) {
                    callback(err, rows, output);
                });
            }
        }
    ],
    function(err, rows, output) {
        con.release();

        if (err) {
            console.error(err);

            return cb(err, rows);
        }

        if (rows.length == 0 || rows.length != output.length) {
            console.log(TAG + " Invalid poster_id");

            return cb(new Error("Strange work..."), rows);
        }
        else {
            for (var i = 0; i < rows.length; i++) {
                for (var attr in rows[i])
                { output[i][attr] = rows[i][attr]; }
            }

            console.log(TAG + " Success Join");

            return cb(null, output);
        }
    });
}


function requestFile(pool, type, id, cb) {
    var TAG = '[requestFile]';
    var con;

    if (!pool) {
        return callback({}, new Error("Empty pool..."));
    }

    async.waterfall([
        function(callback) {
            console.log(TAG + " Start in waterfall");
            console.log(TAG + " getConnection()");

            pool.getConnection(callback);
        },
        function(connection, callback) {
            console.log(TAG + " query(SELECT)");

            con = connection;

            con.query('SELECT filename, uri From ' + type + '_files ' +
            'WHERE file_id=' + id, callback);
        }
    ],
    function (err, rows) {
        if (err) {
            con.release();
            console.log(TAG + " Error occured...");
            console.error(err);

            return cb(err, {});
        }

        if (rows.length == 0) {
            con.release();
            console.log(TAG + " Not exist file");

            return cb(null, {});
        }
        else {
            var output = rows[0];
            console.log(TAG + " Success to get file from DB");

            return cb(null, output);
        }
    });
}


function insertItem(tag, mp3_file, jpg_file, req, res) {
    var audio_file = {
        'filename': mp3_file.originalname,
        'uri': mp3_file.path,
        'size': mp3_file.size,
        'down_count': 0
    };
    var poster_file = {
        'filename': jpg_file.originalname,
        'uri': jpg_file.path,
        'size': jpg_file.size,
        'down_count': 0
    };
    var list = {
        'location': req.body.location
    };
    var item = {
        'title': req.body.title
    };

    var pool = req.app.locals.pool;
    var mysql_escape = req.app.locals.mysql_escape;
    var con;

    async.waterfall([
        function(callback) {
            console.log(tag + " Start in waterfall");
            console.log(tag + " getConnection()");

            pool.getConnection(function(err, connection) { callback(err, connection); });
        },
        function(connection, callback) {
            console.log(tag + " Begin Transaction");

            con = connection;

            con.beginTransaction(function(err) { callback(err); });
        },
        function(callback) {
            console.log(tag + " query to check username (SELECT)");

            con.query('SELECT * FROM advertiser WHERE username='
                    + mysql_escape(req.mySession.username),
                    function(err, rows) { callback(err, rows); });
        },
        function(rows, callback) {
            if (rows.length == 0) {
                console.log(tag + " Not valid user, so rollback.");

                return con.rollback(function() {
                    con.release();
                    deleteFile(tag, mp3_file.path);
                    deleteFile(tag, jpg_file.path);

                    res.json({'msg': 'You are not valid user!'});
                });
            }
            else {
                item.user_id = rows[0].user_id;
                console.log(tag + ' Get user_id : ' + item.user_id);
                console.log(tag + ' Insert audio file into DB');

                con.query('INSERT INTO audio_files SET ?', audio_file,
                    function(err, result) { callback(err, result); });
            }
        },
        function(result, callback) {
            list.audio_id = result.insertId;
            console.log(tag + ' Inserted audio file ID : ' + list.audio_id);
            console.log(tag + ' Insert poster file into DB');

            con.query('INSERT INTO poster_files SET ?', poster_file,
                function(err, result) { callback(err, result); });
        },
        function(result, callback) {
            list.poster_id = result.insertId;
            console.log(tag + ' Inserted poster file ID : ' + list.poster_id);
            console.log(tag + ' Insert file list into DB');

            con.query('INSERT INTO file_list SET ?', list,
                function(err, result) { callback(err, result); });
        },
        function(result, callback) {
            item.list_id = result.insertId;
            console.log(tag + ' Inserted file list ID : ' + item.list_id);
            console.log(tag + ' Insert AD item into DB');

            con.query('INSERT INTO ad_item SET ?', item,
                function(err, result) { callback(err, result); });
        },
        function(result, callback) {
            console.log(tag + ' Inserted AD item ID : ' + result.insertId);
            console.log(tag + ' Commit...');

            con.commit(function(err) { callback(err); });
        }
    ],
    function (err) {
        if (err) {
            console.log(tag + " Occured ERROR!! So rollback.");

            con.rollback(function() {
                console.log(tag + " Callback of rollback.");
                con.release();

                deleteFile(tag, mp3_file.path, function () {
                    deleteFile(tag, jpg_file.path, function () {
                        console.error(err);
                        throw err;
                    });
                });
            });
        }
        else {
            con.release();
            console.log(tag + ' Finish inserting AD item, redirect /main');

            res.redirect('/main');
        }
    });
}


function deleteItem(tag, req, res) {
    var pool = req.app.locals.pool;
    var mysql_escape = req.app.locals.mysql_escape;
    var con;

    async.waterfall([
        function(callback) {
            console.log(tag + " Start in waterfall");
            console.log(tag + " getConnection()");

            pool.getConnection(callback);
        },
        function(connection, callback) {
            console.log(tag + " query to get file_id from file_list (SELECT)");

            con = connection;

            con.query('SELECT * FROM file_list where list_id='
                    + mysql_escape(req.params.listId), callback);
        },
        function(rows, result, callback) {
            if (rows.length == 0) {
                console.log(tag + ' Not exist ad item');

                return res.json({msg:'아이템이 존재하지 않습니다.'})
            }
            else {
                console.log(tag + " query to check audio file (SELECT)");

                var poster_id = rows[0].poster_id;

                con.query('SELECT file_id, uri FROM audio_files WHERE file_id=' + rows[0].audio_id,
                    function (err, rows) {
                        callback(err, rows, poster_id);
                    }
                );
            }
        },
        function(rows, poster_id, callback) {
            console.log(tag + " query to delete audio file (DELETE)");

            con.query('DELETE FROM audio_files WHERE file_id=' + rows[0].file_id,
                function (err) {
                    deleteFile(tag, rows[0].uri);
                    callback(err, poster_id);
                }
            );
        },
        function(poster_id, callback) {
            console.log(tag + " query to check audio file (SELECT)");

            con.query('SELECT file_id, uri FROM poster_files WHERE file_id=' + poster_id,
                function (err, rows) {
                    callback(err, rows);
                }
            );
        },
        function(rows, callback) {
            console.log(tag + " query to delete poster file (DELETE)");

            // TODO: audio_id로 SELECT 날려서 uri get해서 지우는 루틴 짜야한다.

            con.query('DELETE FROM poster_files WHERE file_id=' + rows[0].file_id,
                function (err) {
                    deleteFile(tag, rows[0].uri);
                    callback(err);
                }
            );
        }
    ],
    function (err) {
        if (err) {
            con.release();
            console.error(err);
            throw err;
        }

        console.log(tag + ' Delete ad_item finish, redirect /main');
        res.redirect('/main');
    });
}


function deleteFile(tag, uri, cb) {
    async.waterfall([
        function(callback) {
            console.log(tag + " Start in waterfall");
            console.log(tag + " Check file existing or not");

            fs.exists('./' + uri, function(exist) {
                callback(null, exist);
            });
        },
        function(exist, callback) {
            if(exist) {
                console.log(tag + " Delete file");

                fs.unlink('./' + uri, callback);
            }
            else {
                cb && cb();
                return;
            }
        }
    ],
    function(err) {
        if (err) {
            console.error(err);
            throw err;
        }

        cb && cb();

        console.log(tag + ' Deleted successfully');
    });
}


function allowItem(pool, id, mod, cb) {
    var TAG = '[allowItem]';
    var con;

    async.waterfall([
        function(callback) {
            console.log(TAG + " Start in waterfall");
            console.log(TAG + " getConnection()");

            pool.getConnection(function(err, connection) { callback(err, connection); });
        },
        function(connection, callback) {
            console.log(TAG + " Begin Transaction");

            con = connection;

            con.beginTransaction(function(err) { callback(err); });
        },
        function(callback) {
            console.log(TAG + " query to change allow parameter (UPDATE)");

            con.query('UPDATE ad_item SET allow=' + mod + ' WHERE item_id=' + id,
            function(err, result) { callback(err, result); });
        },
        function(result, callback) {
            if (result.affectedRows == 0) {
                console.log(TAG + " Not valid item");

                callback({name: 'NotExistItem', message: 'There is no item.'});
            }
            else {
                con.commit(function(err) { callback(err); });
            }
        }
    ],
    function(err) {
        if (err) {
            console.log(TAG + " Occured ERROR!! So rollback.");

            return con.rollback(function(err2) {
                console.log(TAG + " Callback of rollback.");
                con.release();

                return cb(err2 || err);
            });
        }

        console.log(TAG + ' Finish updating allow parameter');
        cb(null);
    });
}


function giveSuper(pool, username, mod, cb) {
    var TAG = '[giveSuper]';
    var con;

    async.waterfall([
        function(callback) {
            console.log(TAG + " Start in waterfall");
            console.log(TAG + " getConnection()");

            pool.getConnection(function(err, connection) { callback(err, connection); });
        },
        function(connection, callback) {
            console.log(TAG + " Begin Transaction");

            con = connection;

            con.beginTransaction(function(err) { callback(err); });
        },
        function(callback) {
            console.log(TAG + " query to change super parameter (UPDATE)");

            con.query('UPDATE advertiser SET super=' + mod + ' WHERE username="' + username + '"',
            function(err, result) { callback(err, result); });
        },
        function(result, callback) {
            if (result.affectedRows == 0) {
                console.log(TAG + " Not valid user");

                callback({name: 'NotExistUser', message: 'There is no user.'});
            }
            else {
                con.commit(function(err) { callback(err); });
            }
        }
    ],
    function(err) {
        if (err) {
            console.log(TAG + " Occured ERROR!! So rollback.");

            return con.rollback(function(err2) {
                console.log(TAG + " Callback of rollback.");
                con.release();

                return cb(err2 || err);
            });
        }

        console.log(TAG + ' Finish updating super parameter');
        cb(null);
    });
}


module.exports.requestList = requestList;
module.exports.requestFile = requestFile;
module.exports.insertItem = insertItem;
module.exports.deleteItem = deleteItem;
module.exports.deleteFile = deleteFile;
module.exports.allowItem = allowItem;
module.exports.giveSuper = giveSuper;

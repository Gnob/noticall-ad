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
                output[i].uri = output[i].uri.replace(/\\/g, '/').replace('public/', './');
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
        return cb(new Error("Empty pool..."), null);
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
        con.release();
        if (err) {
            console.log(TAG + " Error occured...");
            console.error(err);

            return cb(err, {});
        }

        if (rows.length == 0) {
            console.log(TAG + " Not exist file");

            return cb(null, null);
        }
        else {
            var output = rows[0];
            console.log(TAG + " Success to get file from DB");

            return cb(null, output);
        }
    });
}


// columm과 value는 WHERE 절을 의미. 비워두면 전체 검색
function requestFilelist(pool, columm, value, cb) {
    var TAG = "[requestFilelist]";
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

            con.query('SELECT file_list.location AS loc, file_list.audio_id AS audio_id, file_list.poster_id AS poster_id, file_list.list_id From file_list ' +
            'INNER JOIN ad_item ON file_list.list_id = ad_item.list_id WHERE ad_item.allow = TRUE ' +
            (columm ? 'AND ' + columm + '=' + value : ''), callback);
        }
    ],
    function(err, rows) {
        con.release();

        if (err) {
            console.error(err);

            return cb(err, rows);
        }

        if (rows.length == 0) {
            console.log(TAG + " Empty List...");

            return cb(new Error("EmptyList"), null);
        }
        else {
            console.log(TAG + " Success Join");

            return cb(null, rows);
        }
    });
}

function insertItem(tag, mp3_file, jpg_file, req, res, cb) {
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

                    cb && cb(err);
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
            console.error(err);
            console.log(tag + " Occured ERROR!! So rollback.");

            con.rollback(function() {
                console.log(tag + " Callback of rollback.");
                con.release();

                deleteFile(tag, mp3_file.path, function (err1) {
                    err1 && console.error(err1);
                    deleteFile(tag, jpg_file.path, function (err2) {
                        err2 && console.error(err2);

                        cb && cb(err);
                    });
                });
            });
        }
        else {
            con.release();
            console.log(tag + ' Finish inserting AD item');

            cb && cb(null);
        }
    });
}


function deleteItem(tag, req, res, cb) {
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
                callback(new Error("NotExistADItem"));
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
        con.release();
        if (err) {
            console.error(err);
            cb && cb(err);
        }
        else {
            cb && cb(null);
        }

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
                cb && cb(null);
                return;
            }
        }
    ],
    function(err) {
        if (err) {
            console.error(err);
            cb && cb(err);
        }
        else {
            cb && cb(null);

            console.log(tag + ' Deleted successfully');
        }
    });
}


function allowItem(pool, id, cb) {
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

            con.query('UPDATE ad_item SET allow=TRUE WHERE item_id=' + id,
            function(err, result) { callback(err, result); });
        },
        function(result, callback) {
            if (result.affectedRows == 0) {
                console.log(TAG + " Not valid item");

                // generate Error
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

        con.release();
        console.log(TAG + ' Finish updating allow parameter');
        cb(null);
    });
}


function disallowItem(pool, id, memo, cb) {
    var TAG = '[disallowItem]';
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
            console.log(TAG + " query to change disallow parameter (UPDATE)");

            con.query('UPDATE ad_item SET memo="' + memo + '", allow=FALSE WHERE item_id=' + id,
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

        con.release();
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

        con.release();
        console.log(TAG + ' Finish updating super parameter');
        cb(null);
    });
}


function addCount(pool, table, count, id, cb) {
    var TAG = '[addCount]';
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
            console.log(TAG + " query to add count parameter (UPDATE)");

            con.query('UPDATE ' + table + ' SET down_count = down_count + ' + count + ' WHERE file_id=' + id,
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

        con.release();
        console.log(TAG + ' Finish updating count');
        cb(null);
    });
}



function addPoint(pool, table, point, user_id, cb) {
    var TAG = '[addPoint]';
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
            console.log(TAG + " query to add count parameter (UPDATE)");

            con.query('UPDATE ' + table + ' SET point = point + ' + point + ' WHERE user_id=' + user_id,
            function(err, result) { callback(err, result); });
        },
        function(result, callback) {
            if (result.affectedRows == 0) {
                console.log(TAG + " Not valid user");

                callback({name: 'NotExistUser', message: 'There is no user.'});
            }
            else {
                con.commit(function(err) { callback(err, result); });
            }
        }
    ],
    function(err, result) {
        if (err) {
            console.log(TAG + " Occured ERROR!! So rollback.");

            return con.rollback(function(err2) {
                console.log(TAG + " Callback of rollback.");
                con.release();

                return cb(err2 || err);
            });
        }

        con.release();
        console.log(TAG + ' Finish updating point');
        console.log(TAG, ' ', result);
        cb(null);
    });
}



function findMail(pool, mysql_escape, table, mail, cb) {
    var TAG = '[findMail]';

    var con;

    async.waterfall([
        function(callback) {
            console.log(TAG + " Start in waterfall");
            console.log(TAG + " getConnection()");

            pool.getConnection(callback);
        },
        function(connection, callback) {
            console.log(TAG + " query to check mail (SELECT)");

            con = connection;

            con.query('SELECT * FROM ' + table + ' WHERE mail='
                    + mysql_escape(mail), callback);
        }
    ],
    function(err, rows, result) {
        con.release();

        if (err) {
            console.log(TAG + ' Failed find...');
            console.error(err);
            cb(err);
        }

        if (rows.length > 0) {
            console.log(TAG + ' Success find : ' + rows[0]);

            cb(null, rows[0]);
        }
        else {
            console.log(TAG + ' There is no user.');

            cb({name: 'NotExistUser', message: 'There is no user.'});
        }
    });
}


module.exports.requestList = requestList;
module.exports.requestFile = requestFile;
module.exports.insertItem = insertItem;
module.exports.deleteItem = deleteItem;
module.exports.deleteFile = deleteFile;
module.exports.allowItem = allowItem;
module.exports.disallowItem = disallowItem;
module.exports.giveSuper = giveSuper;
module.exports.addCount = addCount;
module.exports.findMail = findMail;
module.exports.requestFilelist = requestFilelist;
module.exports.addPoint = addPoint;

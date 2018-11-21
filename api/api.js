module.exports = {
    getAllUsers: function (req, res, con) {
        con.query('SELECT username,email FROM etherpad_lite_db.users', function (error, results, fields) {
            if (error) {
                res.json({ "error": "database-error" })
            } else {
                res.header("Content-Type", 'application/json');
                res.send(JSON.stringify(results, null, 3));
            }
        });
    },
    getAllPrivatePads: function (req, res, con) {
        con.query('SELECT DISTINCT padid FROM etherpad_lite_db.pads', function (error, results, fields) {
            if (error) {
                res.json({ "error": "database-error" })
            } else {
                res.header("Content-Type", 'application/json');
                res.send(JSON.stringify(results, null, 3));
            }
        });
    },
    getUsersRole: function (req, res, con) {
        con.query('SELECT userid,role FROM etherpad_lite_db.pads where padid=\'' + req.query.pad + '\'', function (error, results, fields) {
            if (error) {
                res.json({ "error": "database-error" })
            } else {
                if (results.length > 0) {
                    res.header("Content-Type", 'application/json');
                    res.send(JSON.stringify(results, null, 3));
                }
                else {
                    res.json({ "error": "pad not found" });
                }
            }
        });
    }
}
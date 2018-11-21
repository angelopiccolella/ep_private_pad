module.exports = {
    go2home: function (req, res, con) {
        if (req.session && req.session.user) {
            con.query('SELECT * FROM etherpad_lite_db.users WHERE username =  \'' + req.session.user + '\' ', function (error, results, fields) {
                if (error) {
                    console.log("Error ocurred", error);
                } else {
                    if (results.length > 0) { //utente esiste nel db
                        console.log('User logged! [User: ' + req.session.user + ']');
                        var mypads = [];
                        var pads = [];
                        var role = [];
                        con.query('SELECT * FROM etherpad_lite_db.pads WHERE userid = \'' + req.session.user + '\' AND role = \'admin\'', function (error, results, fields) {
                            if (error) {
                                console.log("Error ocurred", error);
                            } else {
                                for (i = 0; i < results.length; i++) {
                                    mypads[i] = results[i].padid;
                                }
                                con.query('SELECT * FROM etherpad_lite_db.pads WHERE userid = \'' + req.session.user + '\' AND role != \'admin\'', function (error, results, fields) {
                                    if (error) {
                                        console.log("Error ocurred", error);
                                    } else {
                                        for (i = 0; i < results.length; i++) {
                                            pads[i] = results[i].padid;
                                            role[i] = results[i].role;
                                        }
                                        res.render('../node_modules/ep_private_pad/templates/homepage', { username: req.session.user, mypads: mypads, pads: pads, role:role });
                                    }
                                });
                            }
                        });
                    }
                    else {
                        console.log('Username doesn\'t exists.');
                        req.session.destroy();
                        res.redirect('/login');
                    }
                }
            });
        } else {
            console.log('User not logged. Redirect...')
            res.redirect('/login');
        }
    }
}
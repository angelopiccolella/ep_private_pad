module.exports = {
    createPad: function (req, res, con) {
        if (req.session && req.session.user) {
            con.query('SELECT * FROM etherpad_lite_db.users WHERE username =  \'' + req.session.user + '\' ', function (error, results, fields) {
                if (error) {
                    console.log("Error ocurred", error);
                } else {
                    if (results.length > 0) { //utente esiste nel db
                        //verifica pad nel db
                        var padid = req.body.padname;
                        con.query('SELECT * FROM etherpad_lite_db.pads WHERE padid = \'' + padid + '\' AND role = \'admin\'', function (error, results, fields) {
                            if (error) {
                                console.log("Error ocurred", error);
                            } else { //verifica pad
                                if (results.length > 0) { //il pad già esiste nel db come admin
                                    console.log('Pad already exists.')
                                    res.redirect('/p/' + padid);
                                } else { //inserire pad creato nel db con utente come admin
                                    con.query('INSERT INTO etherpad_lite_db.pads (padid,userid,role) VALUES (\'' + padid + '\',\'' + req.session.user + '\', \'admin\')', function (error, results, fields) {
                                        if (error) {
                                            console.log("Error ocurred", error);
                                        } else {
                                            console.log('Pad create: padname ' + padid + ', admin ' + req.session.user);
                                            res.redirect('/p/' + padid);
                                        }
                                    });
                                }
                            }
                        });
                    }
                    else { //utente in sessione non esiste
                        console.log('Username doesn\'t exists.');
                        req.session.destroy();
                        res.redirect('/login');
                    }
                }
            });
        } else { //nessun utente in sessione
            console.log("User not logged. Redirect...");
            res.redirect('/login');
        }
    },
    checkpad: function (req, res, con) {
        var pad = req.params.padname;
        var user = req.session.user;
        res.clearCookie('role');
        res.clearCookie('padPrivacy');
        console.log("Try to access to pad: " + req.params.padname);
        con.query('SELECT * FROM etherpad_lite_db.pads WHERE padid=\'' + pad + '\'', function (error, results, fields) {
            if (error) {
                console.log("Error ocurred", error);
            } else {
                if (results.length > 0) { //il pad è privato
                    console.log("Pad " + pad + " is private.");
                    con.query('SELECT role FROM etherpad_lite_db.pads WHERE padid=\'' + pad + '\' AND userid=\'' + user + '\'', function (error, results, fields) {
                        if (error) {
                            console.log("Error ocurred", error);
                        } else {
                            if (results.length > 0) { //l'utente ha accesso al pad
                                console.log("User access to pad " + pad + " with role: " + results[0].role);
                                res.cookie('role', results[0].role);
                                go2pad(req, res, 'private', pad);
                            } else { //l'utente non ha accesso al pad
                                console.log("User cannot access to pad " + pad + ".");
                                res.redirect('/login?error=not-access');
                            }
                        }
                    })
                } else { //il pad non è privato
                    console.log("Pad " + pad + " is public.");
                    //redirect to pad
                    go2pad(req, res, 'public', pad);
                }
            }
        });
    }
}

function go2pad(req, res, padPrivacy, pad) {

    if (req.cookies.language === undefined) {
        res.cookie('language', settings.padOptions.lang);
    }
    res.cookie('padPrivacy', padPrivacy);
    // The below might break for pads being rewritten
    var isReadOnly = req.url.indexOf("/p/r.") === 0;

    hooks.callAll("padInitToolbar", {
        toolbar: toolbar,
        isReadOnly: isReadOnly
    });

    api = require('etherpad-lite-client');
    etherpad = api.connect({
        apikey: '3d7707c762c93b61f641418cc5aa90a1b1451dc8475220a46f93c866b00f799c',
        host: 'localhost',
        port: 9001,
    });

    var args1 = {
        padID: pad,
    };

    etherpad.getHTML(args1, function (error, data) {
        if (error) {
            console.error('Error getting text pad: ' + error.message);
            res.cookie('padText', '');
            res.send(eejs.require("ep_etherpad-lite/templates/pad.html", {
                req: req,
                toolbar: toolbar,
                isReadOnly: isReadOnly
            }));
        } else {
            var text = data.html;
            text = text.replace('<!DOCTYPE HTML><html><body>', '');
            text = text.replace('</body></html>', '');
            console.log(text);
            res.cookie('padText', text);
            res.send(eejs.require("ep_etherpad-lite/templates/pad.html", {
                req: req,
                toolbar: toolbar,
                isReadOnly: isReadOnly
            }));
        }
    })
}


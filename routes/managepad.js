module.exports = {
    addRole=function (req, res, con) {
        var pad = req.params.padname2Manage;
        var user2add = req.body.username2add;
        var role = req.body.role;

        if (req.session && req.session.user) {
            con.query('SELECT * FROM etherpad_lite_db.users WHERE username =  \'' + req.session.user + '\' ', function (error, results, fields) {
                if (error) {
                    console.log("Error ocurred", error);
                } else {
                    if (results.length > 0) { //utente esiste nel db
                        con.query('SELECT * FROM etherpad_lite_db.pads WHERE userid = \'' + req.session.user + '\' AND padid= \'' + pad + '\' AND role = \'admin\'', function (error, results, fields) {
                            if (error) {
                                console.log("Error ocurred", error);
                            } else {
                                if (results.length > 0) { //l'utente ha accesso alla pagina
                                    //verifica se l'utente esiste nel db
                                    con.query('SELECT * FROM etherpad_lite_db.users WHERE username =  \'' + user2add + '\' ', function (error, results, fields) {
                                        if (error) {
                                            console.log("Error ocurred", error);
                                        } else {
                                            if (results.length > 0) {//l'utente da aggiungere esiste
                                                console.log('Adding ' + user2add + ' to role: ' + role + '.');
                                                con.query('SELECT * FROM etherpad_lite_db.pads WHERE userid=\'' + user2add + '\' and padid=\'' + pad + '\'', function (error, results, fields) {
                                                    if (error) {
                                                        console.log("Error ocurred", error);
                                                    } else {
                                                        if (results.length > 0) { //l'utente già ha un permesso, modificarlo
                                                            con.query('UPDATE `etherpad_lite_db`.`pads` SET `role` = \'' + role + '\' WHERE (`padid` = \'' + pad + '\') and (`userid` = \'' + user2add + '\');', function (error, results, fields) {
                                                                if (error) {
                                                                    console.log("Error ocurred", error);
                                                                } else {
                                                                    console.log('Update successfully: ' + user2add + ' to role: ' + role + '.');
                                                                    res.redirect('/manage/' + pad);
                                                                }
                                                            });
                                                        } else { //l'utente non ha un permesso, aggiungerlo
                                                            con.query('INSERT INTO `etherpad_lite_db`.`pads` (`padid`, `userid`, `role`) VALUES (\'' + pad + '\', \'' + user2add + '\', \'' + role + '\');', function (error, results, fields) {
                                                                if (error) {
                                                                    console.log("Error ocurred", error);
                                                                } else {
                                                                    console.log('Added: ' + user2add + ' to role: ' + role + '.');
                                                                    res.redirect('/manage/' + pad);
                                                                }
                                                            });
                                                        }
                                                    }
                                                });
                                            } else {//l'utente da aggiungere non esiste
                                                console.log('User ' + user2add + 'not found!');
                                                res.redirect('/manage/' + pad + '?error=user-not-found');
                                            }
                                        }
                                    });
                                } else { //l'utente non ha accesso alla pagina
                                    console.log('Username cannot access to this page. Redirect...');
                                    res.redirect('/homepage');
                                }
                            }
                        });

                    } else {
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
    },
    updateRole=function (req, res, con) {
        var pad = req.params.padname2Manage;
        var user2Update = req.body.selectUser;
        var role = req.body.role;

        if (req.session && req.session.user) {
            con.query('SELECT * FROM etherpad_lite_db.users WHERE username =  \'' + req.session.user + '\' ', function (error, results, fields) {
                if (error) {
                    console.log("Error ocurred", error);
                } else {
                    if (results.length > 0) { //utente esiste nel db
                        con.query('SELECT * FROM etherpad_lite_db.pads WHERE userid = \'' + req.session.user + '\' AND padid= \'' + pad + '\' AND role = \'admin\'', function (error, results, fields) {
                            if (error) {
                                console.log("Error ocurred", error);
                            } else {
                                if (results.length > 0) { //l'utente ha accesso alla pagina
                                    console.log('Updating ' + user2Update + ' to role: ' + role + '.');
                                    con.query('UPDATE `etherpad_lite_db`.`pads` SET `role` = \'' + role + '\' WHERE (`padid` = \'' + pad + '\') and (`userid` = \'' + user2Update + '\');', function (error, results, fields) {
                                        if (error) {
                                            console.log("Error ocurred", error);
                                        } else {
                                            console.log('Update successfully: ' + user2Update + ' to role: ' + role + '.');
                                            res.redirect('/manage/' + pad);
                                        }
                                    });
                                } else { //l'utente non ha accesso alla pagina
                                    console.log('User cannot access to this page. Redirect...');
                                    res.redirect('/homepage');
                                }
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
            console.log('User not logged. Redirect...');
            res.redirect('/login');
        }
    },
    manage=function (req, res, con) {
        console.log("Try to access to manage page for the pad: " + req.params.padname2Manage);
        if (req.session && req.session.user) {
            con.query('SELECT * FROM etherpad_lite_db.users WHERE username =  \'' + req.session.user + '\' ', function (error, results, fields) {
                if (error) {
                    console.log("Error ocurred", error);
                } else {
                    if (results.length > 0) { //utente esiste nel db
                        console.log('User already logged!');
                        var pad = req.params.padname2Manage;
                        con.query('SELECT * FROM etherpad_lite_db.pads WHERE userid = \'' + req.session.user + '\' AND padid= \'' + pad + '\' AND role = \'admin\'', function (error, results, fields) {
                            if (error) {
                                console.log("Error ocurred", error);
                            } else {
                                if (results.length > 0) { //l'utente ha accesso alla pagina
                                    var padsByRead = [];
                                    con.query('SELECT * FROM etherpad_lite_db.pads WHERE padid= \'' + pad + '\' AND role = \'read\'', function (error, results, fields) {
                                        if (error) {
                                            console.log("Error ocurred", error);
                                        } else {
                                            if (results.length > 0) { //
                                                for (i = 0; i < results.length; i++) {
                                                    padsByRead[i] = results[i].userid;
                                                }
                                            } else {
                                                padsByRead = [];
                                            }
                                            var padsByWrite = [];
                                            con.query('SELECT * FROM etherpad_lite_db.pads WHERE padid= \'' + pad + '\' AND role = \'write\'', function (error, results, fields) {
                                                if (error) {
                                                    console.log("Error ocurred", error);
                                                } else {
                                                    if (results.length > 0) { //
                                                        for (i = 0; i < results.length; i++) {
                                                            padsByWrite[i] = results[i].userid;
                                                        }
                                                    } else {
                                                        padsByWrite = [];
                                                    }
                                                    res.render('../node_modules/ep_private_pad/templates/manage', { username: req.session.user, pad: pad, padsByRead: padsByRead, padsByWrite: padsByWrite });
                                                }
                                            });
                                        }
                                    });
                                } else { //l'utente non ha accesso alla pagina
                                    console.log('User cannot access to this page. Redirect...')
                                    res.redirect('/homepage');
                                }
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
            console.log('User not logged. Redirect...');
            res.redirect('/login');
        }
    }
}
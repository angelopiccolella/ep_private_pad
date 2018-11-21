var eejs = require('ep_etherpad-lite/node/eejs');
var bodyParser = require("body-parser");
var session = require('client-sessions');
var hooks = require('ep_etherpad-lite/static/js/pluginfw/hooks');
var toolbar = require("ep_etherpad-lite/node/utils/toolbar");
var homepage = require("ep_private_pad/routes/homepage");
var login = require("ep_private_pad/routes/login");
var logout = require("ep_private_pad/routes/logout");
var signup = require("ep_private_pad/routes/signup");
var apiPlugin = require("ep_private_pad/api/api");
//var settings = require("../../src/node/utils/Settings");

//connessione al database
var mysql = require('mysql');
var con = mysql.createConnection({
  host: "localhost",
  user: "etherpaduser",
  password: "PASSWORD"
});

exports.indexWrapper = function (hook_name, args, cb) {
  args.content = eejs.require("ep_private_pad/templates/edit_index.ejs");
  return cb();
}

exports.expressCreateServer = function (hook_name, args, cb) {

  //leggere request e response
  args.app.use(bodyParser.urlencoded({
    extended: true
  }));
  args.app.use(bodyParser.json());

  //settare la sessione
  args.app.use(session({
    cookieName: 'session',
    secret: 'setting-login-session',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
    httpOnly: true,
    secure: true,
    ephemeral: true
  }));


  //settare il template
  args.app.set('view engine', 'ejs');

  //pagina con le credenziali di accesso
  args.app.get('/login', function (req, res) {
    login.getlogin(req, res);
  });
  args.app.post('/login', function (req, res) {
    login.postlogin(req, res, con);
  });

  //logout
  args.app.post('/logout', function (req, res) {
    logout.logout(req, res);
  });

  //pagina di registrazione
  args.app.get('/signup', function (req, res) {
    signup.getsignup(req, res);
  });
  args.app.post('/signup', function (req, res) {
    signup.postsignup(req, res, con);
  });

  //dashboard di un utente loggato
  args.app.get('/homepage', function (req, res) {
    homepage.go2home(req, res, con);
  });

  //crea nuovo pad privato
  args.app.post('/createPad', function (req, res) {
    if (req.session && req.session.user) {
      con.query('SELECT * FROM etherpad_lite_db.users WHERE username =  \'' + req.session.user + '\' ', function (error, results, fields) {
        if (error) {
          console.log("Error ocurred", error);
        } else {
          if (results.length > 0) { //utente esiste nel db
            //verifica pad nel db
            var padid = req.body.padname;
            padid.replace(' ', '_');
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
  });

  //gestione di un pad
  args.app.get('/manage/', function (req, res) {
    res.redirect('/homepage');
  });
  args.app.get('/manage/:padname2Manage', function (req, res) {
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
  });
  //aggiornamento nel db dei permessi
  args.app.post('/updateRole/:padname2Manage', function (req, res) {
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
  });
  //inserimento nel db di un utente con un permesso
  args.app.post('/addRole/:padname2Manage', function (req, res) {
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
  });

  //verifica utente e ruoli all'accesso di un pad
  args.app.get('/checkpad/:padname', function (req, res) {
    var pad = req.params.padname;
    pad = pad.replace('_', ' ');
    var user = req.session.user;
    res.clearCookie('role');
    res.clearCookie('padPrivacy');
    console.log("Try to access to pad: " + pad);
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
  });

  //API calls
  args.app.get('/getAllUsers', function (req, res) {
    apiPlugin.getAllUsers(req, res, con);
  });
  args.app.get('/getAllPrivatePads', function (req, res) {
    apiPlugin.getAllPrivatePads(req, res, con);
  });
  args.app.get('/getUsersRole', function (req, res) {
    apiPlugin.getUsersRole(req, res, con);
  });


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
      res.cookie('padText', text);
      res.send(eejs.require("ep_etherpad-lite/templates/pad.html", {
        req: req,
        toolbar: toolbar,
        isReadOnly: isReadOnly
      }));
    }
  })
}


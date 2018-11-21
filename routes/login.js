const hashing = require('password-hash');

module.exports = {
    getlogin: function (req, res) {
        if (req.session && req.session.user) {
            console.log("User already logged!");
            res.redirect('/homepage');
        } else {
            res.render('../node_modules/ep_private_pad/templates/login', { loginMessage: '' });
        }
    },
    postlogin: function (req, res, con) {
        var password = req.body.password;
        var username = req.body.username;
        if (req.session && req.session.user) {
            console.log("User already logged!");
            res.redirect('/homepage');
        } else {
            console.log("User not logged");
            con.query('SELECT * FROM etherpad_lite_db.users WHERE username =  \'' + username + '\' ', function (error, results, fields) {
                if (error) {
                    console.log("Error ocurred", error);
                } else {
                    if (results.length > 0) {
                        if (hashing.verify(password, results[0].password)) {
                            console.log('Login successfully. [username=' + username + ']');
                            res.cookie('username', username);
                            req.session.user = username;
                            res.redirect('/homepage');
                        } else {
                            console.log('Wrong password!');
                            res.render('../node_modules/ep_private_pad/templates/login', { loginMessage: 'login.wrong-password' });
                        }
                    } else {
                        console.log('Username doesn\'t exists.');
                        res.render('../node_modules/ep_private_pad/templates/login', { loginMessage: 'login.username-inexistent' });
                    }
                }
            });
        }
    }
}
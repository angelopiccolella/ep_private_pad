const hashing = require('password-hash');

module.exports = {
    getsignup: function (req, res) {
        if (req.session && req.session.user) {
            console.log("User already logged. [User: " + req.session.user + "]");
            res.redirect('/homepage');
        } else {
            res.render('../node_modules/ep_private_pad/templates/signup', { signupError: '' });
        }
    },
    postsignup: function (req, res, con) {
        var password = req.body.password;
        var confirmPassword = req.body.confirmPassword;
        var email = req.body.email;
        var username = req.body.username;
        if (req.session && req.session.user) {
            console.log("User already logged!");
            res.redirect('/homepage');
        } else {
            console.log("User not logged.");
            con.query('SELECT * FROM etherpad_lite_db.users WHERE username =  \'' + username + '\' ', function (error, results, fields) {
                if (error) {
                    console.log("Error ocurred", error);
                } else {
                    if (results.length > 0) { //username già esistente
                        console.log('User already exists in database. Redirect...')
                        res.render('../node_modules/ep_private_pad/templates/signup', { signupError: 'signup.user-already-exists' });
                    } else { //aggiungi utente al database
                        console.log('Username doesn\'t exists. Registration...');
                        password = hashing.generate(password);
                        con.query('INSERT INTO etherpad_lite_db.users(username,email,password) VALUES  (\'' + username + '\',\'' + email + '\', \'' + password + '\')', function (error, results, fields) {
                            if (error) {
                                console.log("Error ocurred", error);
                            } else {
                                console.log('Added username ' + username + ' to database.')
                                res.render('../node_modules/ep_private_pad/templates/login', { loginMessage: 'login.signup-success' });
                            }
                        });
                    }
                }
            });
        }
    }
}
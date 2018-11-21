module.exports = {
    logout: function (req, res) {
        console.log('Logging out...');
        res.clearCookie('username');
        req.session.destroy();
        console.log('Logged out.')
        res.redirect('/');
    }
}
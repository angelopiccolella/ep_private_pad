var eejs = require('ep_etherpad-lite/node/eejs');

exports.editbarMenuLeft = function (hook_name, args, cb) {
    args.content = eejs.require("ep_private_pad/templates/menuLeft.ejs") + args.content;
    return cb();
}

exports.editbarMenuRight = function (hook_name, args, cb) {
    args.content = eejs.require("ep_private_pad/templates/menuRight.ejs") + args.content;
    return cb();
}

exports.loading = function (hook_name, args, cb) {
    args.content = eejs.require("ep_private_pad/templates/loading.ejs") + args.content;
    return cb();
}

exports.body = function (hook_name, args, cb) {
    args.content = args.content + eejs.require("ep_private_pad/templates/body.ejs");
    return cb();
}
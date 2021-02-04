/*eslint no-console: 0*/
"use strict";
const express = require('express');
const passport = require('passport');
const xsenv = require('@sap/xsenv');
const JWTStrategy = require('@sap/xssec').JWTStrategy;
const app = express();
const services = xsenv.getServices({ uaa: 'headcount_uaa' });

passport.use(new JWTStrategy(services.uaa));

app.use(passport.initialize());

app.use(passport.authenticate('JWT', {
    session: false
}));

// eslint-disable-next-line no-unused-vars
app.get('/user', function (req, res, next) {
    var user = req.user;
    var result = JSON.stringify(user);
    // res.send(req.user.id);
    res.send(result);
});

const port = process.env.PORT || 3000;

app.listen(port, function () {
    console.log('app listening on port ' + port);
});

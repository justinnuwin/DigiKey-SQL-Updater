"use strict";
const request = require('request');

const cfg = require('./config');

function main(dk) {
    dk.getPartDetails("296-1857-5-ND");
    dk.getChangeNotif("296-1857-5-ND");
};

module.exports = {
    main: main
};
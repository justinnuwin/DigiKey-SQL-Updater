"use strict";
const config = {}

config.clientId = "";
config.clientSecret = "";
config.redirectUri = "";
config.authUrl = "https://sso.digikey.com/as/authorization.oauth2";
config.tokenUrl = "https://sso.digikey.com/as/token.oauth2";
config.maxCalls = 1000;
config.maxBurst = 120;

module.exports = config;
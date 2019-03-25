"use strict";
const https = require('https');
const express = require('express');
const fs = require('fs');

const dkApi = require('./digikeyAPI');
const cfg = require('./config');
const main = require('./main');

const app = express();
const port = 443;

// https://www.seoexpertstuff.com/create-self-signed-ssl-certificate-windows-openssl/
let privateKey = fs.readFileSync('sslcert/server.key', 'utf8');
let certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
let credentials = {key: privateKey, cert: certificate};

app.get('/digi-key', (req, res) => dkApi.getAuthCode_cb(req, res, main.main));

let httpsServer = https.createServer(credentials, app);
httpsServer.listen(port);
console.log(`Listening on port ${port}\n`)
console.log("--- Start the service by authenticating with DigiKey via OAuth (go to the link below) ---")
console.log(cfg.authUrl + `?response_type=code&client_id=${cfg.clientId}&redirect_uri=${cfg.redirectUri}`);
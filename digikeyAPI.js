"use strict";
const request = require("request");
const fs = require("fs");

const cfg = require("./config");

class DKApi {
    constructor (tokens) {
        this.unpackTokens(tokens);
        this.setTokenRefresh();

        // Private
        this.callCount = 0;
        this.burstCount = 0;
        this.countTimer = setInterval(() => this.callCount = 0, 60 * 60 * 24 * 1000);
        this.burstTimer = setInterval(() => this.burstCount = 0, 60 * 15 * 1000);
    }

    unpackTokens(tokens) {
        this.accessToken = tokens.access_token;
        this.refreshToken = tokens.refresh_token;
        this.tokenType = tokens.token_type;
        this.tokenExpiration = tokens.expires_in;
    }

    incrementCounters() {
        this.callCount++;
        this.burstCount++;
    }

    countersGood() {
        if (this.callCount < cfg.maxCalls && this.burstCount < cfg.maxBursts) {
            console.error(`Over limit ${this.callCount} calls & ${this.burstCount} bursts`);
            return false;
        } else {
            return true;
        }
    }

    setTokenRefresh() {
        this.expires = setTimeout(() => this.refreshToken(this.refreshToken), (this.tokenExpiration - 60) * 1000);
    }

    refresh_token(refreshToken) {
        request.post(cfg.tokenUrl, {form: {
            client_id: cfg.clientId,
            client_secret: cfg.clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token"
        }}, (err, res, body) => {
            if (err)
                return console.error(`Post auth code failed: ${err.message}`);

            let tokens = JSON.parse(body);
            if ("access_token" in tokens) {
                this.unpackTokens(tokens);
                this.setTokenRefresh();
            } else if ("error" in tokens) {
                console.error(`Failed: ${tokens.error}: ${tokens.error_description}`);
            }
        });
    }

    getPartDetails(dkPartNumber) {
        if (!this.countersGood())
            return;
        let options = { method: 'POST',
                        url: 'https://api.digikey.com/services/partsearch/v2/partdetails',
                        headers: {  accept: 'application/json',
                                    'content-type': 'application/json',
                                    authorization: this.accessToken,
                                    'x-ibm-client-id': cfg.clientId},
                        body: { Part: dkPartNumber,
                                IncludeAllAssociatedProducts: 'false',
                                IncludeAllForUseWithProducts: 'false'},
                        json: true };
        let self = this;
        request(options, function (err, res, body) {
            if (err)
                return console.error(`Request failed: ${error.message}`);
            console.log('Success: ', body);
            self.incrementCounters();
        });
    }

    getChangeNotif(dkPartNumber) {
        if (!this.countersGood())
            return;
        let options = { method: 'GET',
                        url: `https://api.digikey.com/services/pcn/v1/getpcns/${dkPartNumber}`,
                        headers: {  accept: 'application/json',
                                    authorization: this.accessToken,
                                    'x-ibm-client-id': cfg.clientId}
        };
        let self = this;
        request(options, (err, res, body) => {
            if (err)
                return console.error(`Request failed: ${err.message}`);
            console.log('Success: ', body);
            self.incrementCounters();
        });
    }

};

function exchange_token(authCode, callback) {
    console.log(`Recieved auth code: ${authCode}`);
    request.post(cfg.tokenUrl, {form: {
        code: authCode,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri: cfg.redirectUri,
        grant_type: "authorization_code"
    }}, (err, res, body) => {
        if (err)
            return console.error(`Post auth code failed: ${err.message}`);
        
        let tokens = JSON.parse(body);
        if ("access_token" in tokens)
            callback(new DKApi(tokens));
        else if ("error" in tokens)
            console.error(`Failed: ${tokens.error}: ${tokens.error_description}`);
    });
}

function getAuthCode_cb(req, res, callback) {
    res.status(200).end();
    if ("code" in req.query)
        return exchange_token(req.query.code, callback);
    else if ("error" in req.query)
        console.error(`Error getting auth_code: ${req.query.error}`);
    else
        console.error("Unknwon error receiving auth code");
}

module.exports = {
    getAuthCode_cb: getAuthCode_cb
};

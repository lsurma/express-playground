const pathToRegexp = require('path-to-regexp');
const config = require('app/config');
const router = require('app/services/router');
const querystring = require('querystring');
const normalizeUrl = require('normalize-url');
const util = require('util');
const _ = require('lodash');

const functions = {
    'dumpContext' : function() {
        return util.inspect(this);
    },

    'user' : function() {
        return _.get(this, ['ctx', 'req', 'user'], null);
    },

    'asset' : function(asset) {
        return functions.url(asset, { v : new Date().getTime() });
    },

    'url' : function(url, queryParams) {
        var query = querystring.stringify(queryParams);
            query = query ? "?" + query : "";

        return normalizeUrl(config.baseUrl + '/' + url + query);
    },

    'route' : function(name, params = {}, queryParams = {}, absolute = true) {
        var route = router.list[name];

        if(!route || typeof route == undefined) {
            throw new Error("Route '"+ name +"' not found");
        }

        var url = pathToRegexp.compile(route.fullPathLocalized)(params); 

        return functions.url(url, queryParams);
    }
};


module.exports = functions;

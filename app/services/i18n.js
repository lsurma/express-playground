const glob = require('glob');
const path = require('path');
const _ = require('lodash');

const i18n = {
    params : {
        defaultLocale : "pl",
        dir : null,
    },

    translations : {},

    /**
     * @param {*} key 
     * @param {*} replacements 
     */
    __ : function(key, replacements = {}) {
        var translationKey = i18n.params.defaultLocale + "." + key;
        var translation = _.get(i18n.translations, translationKey, translationKey);

        // Replace values in translated string
        _.each(replacements, (value, key) => {
            translation = _.replace(translation, new RegExp(':' + key, 'g'), value)
        })

        return translation;
    },

    /**
     * @param {string} dir
     */
    init : function(params) {
        i18n.params = _.extend(i18n.params, params);

        var pattern = path.join(i18n.params.dir, '/**/*.js');

        // Sync is used to preform blocking init
        // Routes should be registered in sequential order/way
        var files = glob.sync(pattern)

        // Iterate over filenames and load via require
        files.forEach( (filepath) => {
            // Determine languageName based on dir name without base dir 
            var languageName = path.dirname(filepath).replace(i18n.params.dir, "");
                languageName = _.trim(languageName, "/");

            const filename = path.basename(filepath, '.js');
            const translationsData = require(filepath);

            // Set translations in object
            _.set(i18n.translations, [languageName, filename], translationsData); 
        });

        // Assign translation helper into global object
        global.__ = i18n.__;
    },
};

module.exports = i18n;

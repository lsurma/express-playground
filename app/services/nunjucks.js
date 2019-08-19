const nunjucks = require('nunjucks');
const path = require('path');
const nunjucksFunctions = require('app/support/nunjucks/functions');

const nujucksViewEngine = function(express) {
    // Set express view engine (extension for templates)
    express.set('view engine', 'njk');
    express.set('views', path.join(__dirname,  '../views'));
        
    // Config nunjuck to works with express
    var view = nunjucks.configure(path.join(__dirname,  '../views'), {
        autoescape : true,
        express : express,
        noCache : true,
        watch : true,
    });
    
    // Add global helpers, filters, etc
    Object.keys(nunjucksFunctions).forEach(function(name) {
        view.addGlobal(name, nunjucksFunctions[name]);
    })

    // Add middlewares to express

    return view;
}

module.exports = nujucksViewEngine;
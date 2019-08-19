// require() path resolving based on current dir
require('app-module-path').addPath(__dirname);

//
// Base libs
//
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var app = express();
var fs = require('fs');
var util = require('util');
var session = require('express-session');

//
// Error, debuging utilities
//
var RequestDataError = require('./app/error-types/request-data-error');
var PrettyError = require('pretty-error');
var createError = require('http-errors');
var logger = require('morgan');
var stackman = require('stackman')();
var prettyError = new PrettyError();
debug = require('debug')('app');

express.request.dump = function(...params) {
    // debug('xx', params);
}


//
// App config
//
var config = require('./app/config');
config.baseDir = __dirname;
config.publicDir = 'public';

config.publicPath = path.join(config.baseDir, config.publicDir);
config.appPath = path.join(config.baseDir, 'app');

// App services, helpers, globals etc
var nunjucks = require('./app/services/nunjucks');
var router = require('app/services/router')
var i18n = require('app/services/i18n').init({
    defaultLocale : "pl",
    dir : path.join(config.appPath, "i18n/")
});

//
// Passport auth
//
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('app/models/User');

// TODO: Separate service
passport.use(
    new LocalStrategy(
        {
            usernameField : "login",
        },

        async function(username, password, done) {
            const user = await User.findOne({
                login : username
            });

            if(!user) {
                return done(
                    new RequestDataError([
                        {
                            message : __('validation.user-password-wrong'),
                            path : ['login'],
                        }
                    ]), 
                    false
                );
            }

            if(user && user.password != password) {
                return done(
                    new RequestDataError([
                        {
                            message : __('validation.user-password-wrong'),
                            path : ['login'],
                        }
                    ]), 
                    false
                );
            }

            // Otherwise all is ok
            return done(null, user);
        }
    )
)

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});
  
passport.deserializeUser(async function(id, cb) {
    const user = await User.findById(id);

    cb(null, user);
});



//
// Set view engine setup
//
var view = nunjucks(app);

//
// Connect to MongoDB
//
var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1/test', { 
    useCreateIndex : true,
    useNewUrlParser: true,
    autoIndex : true
}).then(function(instance) {
    debug('Connected to mongodb');
}).catch(function(reason) {
    debug(reason);
});
mongoose.set('debug', true);

//
// Set middlewares
//
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser("app"));
app.use(express.static(config.publicPath));

app.use(session({
    resave: false,
    secret : "app",
    saveUninitialized: false,
    cookie: { secure: false }
}))

app.use(passport.initialize());
app.use(passport.session());

// Request-response local data
app.use(function(req, res, next) {
    res.locals.req = req;
    res.locals.res = res;
    
    next();
});

// Last middleware for logging
app.use(function(req, res, next) {
    debug('Middle: debug');
    // after routes middleware
    // var name = Date.now() + '.json';

    // var data = JSON.stringify(req.headers);

    // fs.writeFile(path.join(__dirname, 'storage', 'express-telescope', name), data, err => {
    //     debug(err);
    // });
    
    // debug(req);

    req.on('close', () => {
        debug('Request-response closed');
    });

    req.on('end', () => {
        debug('Request-response ended');
    });

    // Forward
    next();
});


//
// Inspection/debug tools
//
// var debugbar = require('express-debug')(app);

//
// Init/install app routes
//
    // web routes
    app.use(
        '/', 
        router.bootstrap(
            path.join(config.baseDir, 'app', 'controllers', 'web')
        )
    );
    

// After routes middleware
// If route is not found create 404
// otherwise end request
app.use(function (req, res, next) {
    var isRouteFound = req.isRouteFound || false;

    if(!isRouteFound) {
        debug('404: ', req.path);
        next(createError(404));
    }
});

// Catch FormRequestError
app.use(function (error, req, res, next) {
    debug('Middle: FormRequestError');

    if(error instanceof RequestDataError) {
        const clientAcceptsJson = req.xhr || req.headers.accept.indexOf('json') > -1;

        // Set 400 status
        res.status(error.status);

        // Return response with errors
        if(clientAcceptsJson) {
            res.json({ 
                message : error.message,
                errors : error.errors
            });
        } else {
            res.send(error.message);
        }

        // Return void for preventing others middlewares
        return;
    }

    // Forward error to next handler, if current error is not RequestDataError
    next(error);
});


//
// Handling all other errors (500 etc)
//


app.use(
/**
 * @param {express} error 
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @param {express.NextFunction} next 
 */    
function (error, req, res, next) {
    debug('Middle: Errors');
    const clientAcceptsJson = req.xhr || req.headers.accept.indexOf('json') > -1;
    const status = error.status || 500;

    
    if(res.headersSent) {
        debug(error);
    } else {
        // Send status
        res.status(status);

        // 500 errors with stacktrace beutified 
        if(status == 500) {

            stackman.callsites(error, function (err, callsites) {
                if (err) throw err
                
                stackman.sourceContexts(callsites, { inAppLines : 15, libraryLines : 0 }, function (err, context) {
                    if (err) throw err
                    
                    if(!res.headersSent) {
                        res.render('errors/error', {
                            error: error,
                            callsites : callsites,
                            sourceContexts : context
                        });
                    } else {
                        debug(error);
                    }
                    
                });
            });

        } else {
            debug('Err (Others):');
            res.send(error);
        }

    }

    // // set locals, only providing error in development
    // res.locals.message = error.message;
    // res.locals.error = req.app.get('env') === 'development' ? error : {};

    // // Accepts JSON
    // var acceptsJson = req.xhr || req.headers.accept.indexOf('json') > -1;

    // debug(error);

    // // render the error page
    // // or emit console output if response was sent
    // if (res.headersSent) {
    //     debug('Headers was sent');
    //     debug(prettyError.render(error));
    // } else {
    //     var status = error.status || 500;
    //     res.status(status);
    //     debug(prettyError.render(error));

    //     // Handle validation/bad request errors
    //     if(status == 400) {
    //         if(acceptsJson) {
    //             res.json(error.errors);
    //         } else {
    //             res.send(error.message);
    //         }
    //     } else if(status == 500) {
            // stackman.callsites(error, function (err, callsites) {
            //     if (err) throw err
                
            //     stackman.sourceContexts(callsites, { inAppLines : 15, libraryLines : 0 }, function (err, context) {
            //         if (err) throw err
    
            //         res.render('errors/error', {
            //             error: error,
            //             callsites : callsites,
            //             sourceContexts : context
            //         });
            //     });
            // });
    //     } else {
    //         if(acceptsJson) {
    //             res.json({ error : error.message });
    //         } else {
    //             res.send(error.message);
    //         }
    //     }
    // }

}
);


module.exports = app;

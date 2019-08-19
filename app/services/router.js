const glob = require('glob');
const path = require('path');
const express = require('express');

const router = {
    /**
     * List of routes by name or unnamed grouped
     */
    list : {
        "_unnamed" : [],
    },

    /**
     * Bootstrap routes from directory
     * @param {string} dir
     * @returns {express.Router} 
     */
    bootstrap : function(dir) {
        var start = new Date().getTime();

        var pattern = path.join(dir, '/**/*.js');
        var actions = [];
        var actionsGrouped = {};
        var expressRouter = express.Router();

        // Sync is used to preform blocking bootstraping
        // Routes should be registered in sequential order/way
        var files = glob.sync(pattern)

        // Iterate over filenames and load via require
        files.forEach( (filename) => {
            // Determine dir name without base dir 
            var groupPrefix = path.dirname(filename).replace(dir, "");
                groupPrefix = groupPrefix.length <= 0 ? "/" : groupPrefix;

            // Load file and merge actions
            actionsGrouped[groupPrefix] = (actionsGrouped[groupPrefix] || []).concat(require(filename));
        });

        // Sort actions in each group and create single flat array of actions
        Object.keys(actionsGrouped).forEach((group, index) => {
            // Sort actions in each group
            actionsGrouped[group] = actionsGrouped[group].sort((a, b) => {
                return (a.order || 0) <= (b.order || 0);
            });

            // Append group prefix to each action
            actionsGrouped[group] = actionsGrouped[group].map((action) => {
                // Via spread operator
                return {...action, ...{ groupPrefix : group }};
            });

            // Merge actions
            actions = actions.concat(actionsGrouped[group]);
        });

        // Path translations (temp)
        var i18n = {
            'home' : 'home',
        };

        // Iterate over all actions, translate paths, create express routes
        actions.forEach((action) => {
            const fullPath = path.join(action.groupPrefix, action.path);
            const fullPathLocalized = fullPath.split("/").map((part) => {
                return i18n[part] || part;
            }).join("/");

            /**
             * Wrap action handler into promise, resolve, forward via next() to middlewares after route
             * 
             * @param {Express.Request} req 
             * @param {Express.Response} res 
             * @param {NextFunction} next 
             */
            const actionHandler = (req, res, next) => {
                // Mark route as found/handled
                req.isRouteFound = true;

                return new Promise(resolve => {
                    // Resolve controller handler
                    resolve(action.handler(req, res, next));

                    // Forward to next middleware (debug etc)
                    next();
                })
                .catch(next);
            }

            // Prepare action method
            const method = (action.method || "GET").toLowerCase();
            
            // Merge action data
            action = {...action, ...{ 
                fullPath : fullPath, 
                fullPathLocalized : fullPathLocalized
            }}

            // Add route to list
            if(action.name) {
                router.list[action.name] = action;
            } else {
                router.list["_unnamed"].push(action);
            }

            // Create express route
            expressRouter[method]( action.fullPathLocalized, [].concat(action.middlewares || [], actionHandler) );
        });

        debug(`Bootstraped actions from: '${dir}', in ${ new Date().getTime() - start }ms`);
      
        return expressRouter;
    }
};

module.exports = router;

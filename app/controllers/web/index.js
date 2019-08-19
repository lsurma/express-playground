const Joi = require('@hapi/joi');
const requestDataValidation = require('app/middlewares/request-data-validation');
const UploadMiddleware = require('app/middlewares/upload');
const Upload = new UploadMiddleware;

// // add : async function(req, res, next) {
// //     var name = req.body.name;

// //     res.json(req.body);
    
// //     // var newUser = new User({ name : name, surname : "xd2" });

// //     // return new Promise(function(resolve, reject) {
        

// //     //     newUser.save(function(err, saved) {
// //     //         if(err) {
// //     //             reject(err);
// //     //             return;
// //     //         } 

// //     //         res.send('saved: ' + saved.toString());
// //     //         resolve(saved.toString());
// //     //     });
// //     // });
// // }

const formValidationSchema = Joi.object().keys({
    profile : Joi.object().keys({
        name : Joi.number().required().min(5),
        surname : Joi.string().required(),
    }),

    // Comes from upload
    avatar : Joi.object().min(1),

    books : Joi.array().items(Joi.string().required()),
});


var actions = [];

// Route/action
actions.push({
    name : "home.index",
    path : "/",
    middlewares : [],

    /**
     * @param {Express.Request} req 
     * @param {Express.Response} res 
     * @param {NextFunction} next 
     */
    handler : async function(req, res, next) {
        res.render('pages/index', {
            title : 'index',
        });
    },

    order : 1,
})

actions.push({
    method : "post",
    name : "add",
    path : "/add",
    middlewares : [
        Upload.image("avatar"), 
        requestDataValidation(formValidationSchema), 
    ],
    handler : function(req, res, next) {
        res.render('pages/form', {
            title : 'test'
        });
    },

    order : 1,
})

actions.push({
    name : "home.form",
    path : "/form",
    middlewares : [],
    handler : function(req, res, next) {
        
        res.render('pages/form', {
            title : 'test'
        });
    },

    order : 1,
})

module.exports = actions;
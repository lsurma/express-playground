const requestDataValidation = require('app/middlewares/request-data-validation');
const Joi = require('@hapi/joi');
const passport = require('passport');

const loginFormSchema = Joi.object().keys({
    login : Joi.string().required(),
    password : Joi.string().required(),
});

const User = require('app/models/User');

module.exports = [
    {
        method : "post",
        path : "/login",
        middlewares : [
            requestDataValidation(loginFormSchema),
            passport.authenticate('local')
        ],
        handler : function(req, res, next) {
            res.json({
                status : true,
                redirectUrl : "http://localhost"
            });        
        },
    },


    {
        name : "auth.login",
        path : "/login",
        middlewares : [],
        handler : function(req, res, next) {
            
            res.render('pages/auth/login', {
                title : 'Login'
            });
        },

        order : 1,
    }
];
const requestDataValidation = require('app/middlewares/request-data-validation');
const Joi = require('@hapi/joi');

const registerSchema = Joi.object().keys({
    login : Joi.string().required().min(1).max(20),
    password : Joi.string().required().min(6).max(255),
    password_repeat : Joi.string().required().min(6).valid(Joi.ref('password')),
});


const User = require('app/models/User');

module.exports = [
    {
        method : "post",
        path : "/register",
        middlewares : [
            requestDataValidation(registerSchema)
        ],
        handler : async function(req, res, next) {
            const newUser = new User({
                login : req.body.login,
                password : req.body.password
            });

            // save user
            await newUser.save();

            res.json(newUser);        
        },
    },


    {
        name : "auth.register",
        path : "/register",
        middlewares : [],
        handler : function(req, res, next) {
            
            res.render('pages/auth/register', {
                title : 'Rejestracja'
            });
        },

        order : 1,
    }
];
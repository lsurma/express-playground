
const Joi = require('@hapi/joi');
const RequestDataError = require('app/error-types/request-data-error');
const _ = require('lodash');

/**
 * @param {Object} schema 
 * @param {Object} joiOptions
 * @param {string} bagType 
 */
function requestDataValidation(schema, joiOptions = {}, bag = "body") {
    /**
     * @param {Express.Request} req 
     * @param {Express.Response} res 
     * @param {NextFunction} next 
     */
    return (req, res, next) => {
        const validation = Joi.validate(req[bag], schema, {
            abortEarly : false,
            allowUnknown : true
        });

        // Throw FormRequestError
        if(validation.error) {
            // Translate joi error details
            var errors = _.get(validation, ['error', 'details'], []);

            errors.forEach((error, key) => {
                error.context.label = __('validation.attributes.' + error.path.join("."));
                error.message = __('validation.type.' + error.type, error.context);
            });

            // Forward with error
            return next(
                new RequestDataError(validation.error.details)
            );
        }
        
        return next();
    }
}

module.exports = requestDataValidation;
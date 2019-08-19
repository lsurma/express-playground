
class RequestDataError extends Error 
{
    constructor(errors) {
        super();

        Error.captureStackTrace(this, this.constructor);
        
        this.name = this.constructor.name;
        this.status = 400;
        this.message = "Niepoprawne dane";
        this.errors = errors;
    }
} 


module.exports = RequestDataError;
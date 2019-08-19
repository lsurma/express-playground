const multer = require('multer');
const RequestDataError = require('app/error-types/request-data-error');

class Upload
{
    constructor() {

        this.mimes = {
            'image' : ['image/jpeg', 'image/png', 'image/gif']
        };

        this.diskStorage = multer.diskStorage({
            destination : 'storage/public/uploads',
            
            filename : function (req, file, cb) {
                cb(null, file.originalname)
            }
        });

    }

    image(field) {
        // Multer upload definition
        const upload = multer({
            storage : this.diskStorage,
        
            limits : {
                fileSize : 555,
            },
        
            fileFilter : (req, file, cb) => {
                if(this.mimes.image.includes(file.mimetype)) {
                    return cb(null, true);
                }
                
                return cb(new RequestDataError([
                    { 
                        path : [field], 
                        message : "Zły format pliku" 
                    }
                ]), false);
            }
        });

        return function(req, res, next) {

            // Upload callback fn
            const callback = function(error) {
                if (error instanceof multer.MulterError) {
                    return next(
                        new RequestDataError([
                            { 
                                path : [field], 
                                message : error.message
                            }
                        ])
                    );
        
                } else if (error) {
                    return next(error);
                }
        
                // Populate body with data of file, for validation performing
                req.body[field] = req.file ? req.file : {};
        
        
                // Upload is valid
                return next();
            }
            
            // Upload
            return upload.single(field)(req, res, callback);
        }
    }
}

module.exports = Upload;
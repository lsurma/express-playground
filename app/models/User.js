const moongoose = require('mongoose');
const Schema = moongoose.Schema;

const userSchema = new Schema({
    login : {
        type : String,
        unique: true,
        required : true,
        minlength : 5,
    },

    password : {
        type : String,
        required : true
    }
});

module.exports = moongoose.model('User', userSchema);
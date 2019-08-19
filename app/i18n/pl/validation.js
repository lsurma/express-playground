module.exports = {
    key : "value",

    type : {
        number : {
            base : ":label musi być liczbą",
            min : ":label musi być większy lub równy :limit"
        },

        string : {
            min : ":label musi mieć :limit lub więcej znaków"
        },

        any : {
            empty : ":label nie może być pusta"
        }
    },

    attributes : {
        login : "login",
        
        password : "hasło",
        
        profile : {
            name : "Imię",
        },

        books : {
            0 : "książka #1",
            1 : "książka #2",
            2 : "książka #3",
        }
    },

    "user-password-wrong" : "Login lub hasło jest nieprawidłowe"
}
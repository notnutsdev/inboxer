const validation = {};

validation.isStrongPassword = password => {
    const password_strength_regex = /^(?=.*[?!.*%$£+=@&])(?=.*[0-9])(?=.*[a-zA-Z]).{5,15}$/g;
    if (!password.match(password_strength_regex)) {
        return false;
    }
    return true;
}

// Username validation
// Regex
validation.username_regex = /^[a-zA-Z0-9_-]{3,20}$/g;
// Function
validation.isValidUsername = username => {
    if (!username.match(validation.username_regex)) {
        return false;
    }
    return true;
}

module.exports = validation;
const validation = {};

validation.isStrongPassword = password => {
    const password_strength_regex = /^(?=.*[?!.*%$£+=@&])(?=.*[0-9])(?=.*[a-zA-Z]).{5,15}$/g;
    if (!password.match(password_strength_regex)) {
        return false;
    }
    return true;
}

validation.isValidUsername = username => {
    const username_regex = /^[a-zA-Z0-9_-]{3,20}$/g;
    if (!username.match(username_regex)) {
        return false;
    }
    return true;
}

module.exports = validation;
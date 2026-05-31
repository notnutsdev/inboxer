const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const User = require("../models/users");
const { Op } = require("sequelize");

const validation = require('../utils/validation');

router.use((req, res, next) => {
    if (req.session.is_logged_in) {
        return res.redirect("/");
    }

    next();
});

router.route("/register")
.get((req, res) => {
    return res.render("register.ejs");
})
.post(async (req, res) => {
    const timestamp = Math.floor(Date.now()/1000);
    const salt_rounds = 10; // for bcrypt

    let username;
    let password = "";
    let user_group; // default to regular accounts

    // Create an anonymous account
    if (req.body.anonymous_account == "") {
        user_group = 1;

        // find a unique username for the anon user
        while (true) {
            username = "Anon_" + Math.ceil(Math.random() * 99999999).toString();
            const user_exists = await User.findOne({ where: { username: username, group: { [Op.gt]: 0 } }}); // skip throwaway accounts
            
            if (!user_exists) {
                break;
            }
        }
        
        // Create a random password for the user
        const alphabet = "abcdefghijklmnopqrstuvwxyz";
        const charlist = alphabet + alphabet.toUpperCase() + "!?@&+$£*%";

        for (i = 0; i < 10; i++) {
            password += charlist[Math.floor(Math.random() * charlist.length)];
        }
    } else {
        user_group = 2;

        username = req.body.username;
        password = req.body.password;

        if (!username || !password) {
            return res.render("register.ejs", { error: "Please fill out all the form fields." });
        }

        if (!validation.isValidUsername(username)) {
            return res.render("register.ejs", { error: "Usernames can only contain letters, numbers, underscores (_) and hyphens (-)." });
        }

        // Check password strength
        if (!validation.isStrongPassword(password)) {
            return res.render("register.ejs", { error: "Password is too weak. Please provide a password with at least one number and one special character (?!.*%$£+=@&)" });
        }

        // Check if username is already in use
        const user_exists = await User.findOne({ where: { username: username, group: { [Op.gt]: 0 }}}) // find if a user (with a group greater than 0, as 0 (throwaway) accounts can have duplicate usernames) as the same username
        
        if (user_exists) {
            return res.render("register.ejs", { error: "User with that username already exists." })
        }
    }

    // Hash passwords
    const password_hash = await bcrypt.hash(password, salt_rounds);

    const user = await User.create({ username: username, password: password_hash, creation_date: timestamp, group: user_group });
    delete user.dataValues.password; // removing password from user object so that it doesn't get added to the session

    req.session.is_logged_in = true;
    req.session.user = user;

    if (user_group == 1) {
        const account_end_date = new Date((timestamp + (7 * 24 * 60 * 60)) * 1000).toString(); // The timestamp of the end of the account (7 days later)
        return res.render('blank.ejs', {
            success: `New anonymous account created!<br>Your account will be active until the: <b>${account_end_date}</b><br>You account username is: <code>${username}</code><br>Your account password is: <code>${password}</code>`
        });
    }

    return res.render("blank.ejs", { success: "Account successfully created!" });
});

router.route("/login")
.get((req, res) => {
    res.render("login.ejs");
})
.post(async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.render("login.ejs", { error: "Please enter a username/password." });
    }

    const user = await User.findOne({ where: { username: username, group: { [Op.gt]: 0 } } });

    if (!user) {
        return res.render("login.ejs", { error: "User not found." });
    }

    if (user.group == 1 && user.creation_date + (7 * 24 * 60 * 60) <= Math.floor(Date.now()/1000)) {
        return res.render("login.ejs", { error: "This anon account has expired. You can still create a new one." });
    }

    // Check password hash
    password_matches = await bcrypt.compare(password, user.password);

    if (!password_matches) {
        return res.render("login.ejs", { error: "Invalid password." })
    };

    delete user.dataValues.password; // removing password from user object so that it doesn't get added to the session
    req.session.is_logged_in = true;
    req.session.user = user;

    // Redirect user to previous page
    const redirect = req.query.redirect;
    if (redirect && redirect.match(/^\/[a-z-0-9-\/]*$/s)) { // make sure the user doesn't try to access something else than an internal URL
        return res.redirect(redirect);
    }

    res.render("blank.ejs", { success: "Logged in successfully!" });
})

module.exports = router;
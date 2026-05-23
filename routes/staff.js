const express = require("express")
const route = express.Router()

const { Webhook, MessageBuilder } = require("discord-webhook-node");

process.loadEnvFile("./.env");

//// STAFF RELATED

// Staff login URL.
// Checks if the user isn't already logged in as a staff member
route.all(process.env.STAFF_LOGIN_URL, (req, res, next) => {
    if (req.session.staff_login) {
        return res.redirect("/");
    };
    next();
});

route.get(process.env.STAFF_LOGIN_URL, (req, res) => {
    res.render('staff_login.ejs');
})

route.post(process.env.STAFF_LOGIN_URL, (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) return res.render("staff_login.ejs", { error: "Please fill out a username and password." });

    const staff_codes = {};
    process.env.STAFF_CODES.split(",").forEach(value => {
        const user_pass = value.split(':');
        staff_codes[user_pass[0]] = user_pass[1]
    }); // Create an object with: { username: password } from the .env data

    // Checks is the username/password provided by the user are in the staff_codes object
    for (let [key, value] of Object.entries(staff_codes)) {
        if (username === key && password === value) {
            req.session.staff_login = { username: username };
            return res.render("staff_login.ejs", { success: "Login successfull!" });
        }
    }

    res.render("staff_login.ejs", { error: "Invalid username/password." });
})

route.get(process.env.STAFF_LOGIN_URL + "/logout", (req, res) => {
    if (!req.session.staff_login) {
        return res.redirect(process.env.STAFF_LOGIN_URL);
    }
    req.session.staff_login = null; // Logout the user
    res.redirect("/");
})

route.get("/delete/:uid", (req, res) => {
    const uid = req.params.uid;

    if (!req.session.staff_login) {
        return res.redirect("/");
    }
    
    const post = db.prepare("SELECT * FROM posts WHERE uid = ?", [ uid ]).all();

    if (!post) return req.redirect("/");

    db.exec("DELETE FROM posts WHERE uid = ?", [ uid ]);

    // Log everything to the webhook log channel
    const hook = new Webhook(process.env.STAFF_LOGS_WEBHOOK);
    const embed = new MessageBuilder()
    .setAuthor(`Action taken by: ${req.session.staff_login.username}`)
    .setTitle("Post deleted")
    .setColor("#fff")
    .addField("Post ID", `\`${uid}\``)
    .addField("Action", "Deletion")
    .addField("Post Author", `\`${post[0].username}\``)
    .addField("Original content", `\`\`\`${post[0].content}\`\`\``)
    .setTimestamp();
    hook.send(embed);

    return res.render("blank.ejs", { success: "Deleted post with ID: " + uid });
})

module.exports = route
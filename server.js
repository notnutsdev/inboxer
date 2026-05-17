const express = require("express");
const session = require("express-session");
const app = express();

const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync("./db/database.db");
const initDB = require("./utils/initdb");

const showdown = require("showdown");
const md_ext = require("./utils/md_extensions");
const converter = new showdown.Converter({ tasklists: true, underline: true, strikethrough: true, parseImgDimensions: true, extensions: [ md_ext.hrTag, md_ext.videoTag ] });

const validator = require("validator");

const config = require("./config.json");
const banned_words = require("./banned_words.json");

const { Webhook, MessageBuilder } = require("discord-webhook-node");


// Loading environment variables
process.loadEnvFile("./.env");

// Setting ejs as our view engine
app.set("view engine", "ejs");

// Express middleware
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static("public"));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.get("/", (req, res) => {
    const posts = db.prepare("SELECT * FROM posts ORDER BY RANDOM() LIMIT 5;").all();
    res.render("index.ejs", { posts: posts });
})

app.get('/create', (req, res) => {
    res.render("create.ejs");
})

app.post("/create", (req, res) => {
    const username = req.body.username;
    let content = req.body.content;

    if (!username) {
        return res.render("create.ejs", { error: "Please enter a username" })
    } else if (!content) {
        return res.render("create.ejs", { error: "Please enter some content." })
    }

    if (username.length > 100) return res.render("create.ejs", { error: "Username too long." });

    for (let i = 0; i< banned_words.length; i++) {
        const word = banned_words[i];
        if (content.includes(word)) {
            return res.render("create.ejs", { error: "Your post contains banned words." });
        }
    }

    const uuid = crypto.randomUUID();

    content = converter.makeHtml(validator.escape(content));

    db.exec(`
        INSERT INTO posts (uid, username, content, permissions) VALUES ('${uuid}', '${validator.escape(username)}', '${content}', 0);
    `);

    res.redirect("/post/" + uuid);
    // res.send(`Successfully created post! ${uuid}`);
})

app.get('/post/:uid', (req, res) => {
    const uid = req.params.uid;
    let post = db.prepare(`SELECT * FROM posts WHERE uid = '${uid}';`).all()[0];
    
    if (!post) {
        return res.render("view.ejs", { error: "No post found for this ID." });
    }

    if (req.session.staff_login) {
        post.isStaff = true;
    }

    res.render("view.ejs", post);
})

app.get("/random", (req, res) => {
    const post = db.prepare("SELECT * FROM posts ORDER BY RANDOM() LIMIT 1;").all()[0];
    res.redirect("/post/" + post.uid);
})

app.get("/report", (req, res) => {
    res.render("report.ejs", (req.query.post_id) ? { post_id: req.query.post_id } : {}); // If a post_id was provided in the query parameters, fill it in the post_id field
})

app.post("/report", (req, res) => {
    const post_id = req.body.post_id;
    const email = req.body.email;
    const message = req.body.message;

    // Check provided data
    if (!post_id || !email || !message) return res.render("report.ejs", { error: "Please fill out all form fields." });
    if (!validator.isEmail(email)) return res.render("report.ejs", { error: "Invalid email address." });
    if (5 > message.length || message.length > 3000) return res.render("report.ejs", { error: "Your message must be between 5 and 3000 characters." })
    
    // Check that the given post ID exists in the database to prevent useless reports.
    const post = db.prepare(`SELECT * FROM posts WHERE uid = '${post_id}';`).all();

    if (post.length <= 0) return res.render("report.ejs", { error: "Post with this ID doesn't exist in our records." });

    const webhooks = process.env.DISCORD_WEBHOOKS.split(",");
    const hook_url = webhooks[Math.floor(Math.random() * webhooks.length)]; // Get a random webhook URL.

    // Sending the message with the webhook
    const hook = new Webhook(hook_url);
    const embed = new MessageBuilder()
    .setColor("#fff")
    .setTitle("New report")
    .setAuthor(`Sent by: ${email}`)
    .addField("Post ID", `\`${post_id}\``)
    .addField("Post link", `[click here](${req.protocol}://${req.hostname}/post/${post_id})`)
    .addField("Post author username:", `\`${post[0].username}\``)
    .addField("Report message", `\`\`\`${message}\`\`\``)
    .setTimestamp();

    hook.send(embed)
    .catch(() => res.render("report.ejs", { error: "An error occured while sending your request. Our systems might be overwelhmed. Please try again later or contact us on Discord." }));

    res.render("report.ejs", { success: "Your report was successfully sent to our team!<br>You will receive an email when we review the post." })
})

// Bonus pages
// Pages on the homepage
// In config.json's urls object, each key is a path and the value the ID of the post it should redirect to.
// Example: { "test": "ca04eaab-ffef-4515-a820-32368c626ac5" } redirects /test to /post/ca04eaab-ffef-4515-a820-32368c626ac5
for (const [key, value] of Object.entries(config.urls)) {
    app.get("/" + key, (req, res) => res.redirect("/post/" + value));
}

// Staff login URL.
// Checks if the user isn't already logged in as a staff member
app.all(process.env.STAFF_LOGIN_URL, (req, res, next) => {
    if (req.session.staff_login) {
        return res.redirect("/");
    };
    next();
});

app.get(process.env.STAFF_LOGIN_URL, (req, res) => {
    res.render('staff_login.ejs');
})

app.post(process.env.STAFF_LOGIN_URL, (req, res) => {
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

app.get(process.env.STAFF_LOGIN_URL + "/logout", (req, res) => {
    if (!req.session.staff_login) {
        return res.redirect(process.env.STAFF_LOGIN_URL);
    }
    req.session.staff_login = null; // Logout the user
    res.redirect("/");
})

app.get("/delete/:uid", (req, res) => {
    const uid = req.params.uid;

    if (!req.session.staff_login) {
        return res.redirect("/");
    }
    
    const post = db.prepare(`SELECT * FROM posts WHERE uid = '${uid}'`).all();

    if (!post) return req.redirect("/");

    db.exec(`DELETE FROM posts WHERE uid = '${uid}'`);

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

// Route to load libraries
app.get("/libraries/:file", (req, res) => {
    const fp = config.libraries[req.params.file];

    if (!fp) return res.status(404).send("404 not found");

    res.sendFile(__dirname + fp)
})

app.listen(8000, () => {
    initDB(db);
    console.log(`                  @@@@@@@@@@@@                  
             @@@@@@@@@@@@@@@@@@@@@@             
          @@@@@@@@@@@@@@@@@@@@@@@@@@@@          
       @@@@@@@@@@%:          :%@@@@@@@@@@       
    @@@@@@@@%#*:                .*#%@@@@@@@@    
    @@@@@*+=.          .=+++-   .=++++*@@@@@    
  @@@@@@%:             :%@@@%*: :%@@#=:%@@@@@@  
  @@@@@+..             ..+@@@@@+..+@@@%-+@@@@@  
 @@@@@%=                  .*@@@+  =%@@%:=%@@@@@ 
 @@@@%:                     +@@+   :%@%: :%@@@@ 
 @@@@%:                     :==:   .-=-. :%@@@@ 
 @@@@%:                                  :%@@@@ 
 @@@@%:.                                 :%@@@@ 
 @@@@@-...                               :%@@@@ 
 @@@@@=-:..                              :%@@@@ 
 @@@@@%*-::..                           =%@@@@@ 
  @@@@@#=-:..                           +@@@@@  
  @@@@@@@+--:::....                   :%@@@@@@  
    @@@@@##*=--:::..               .=+*@@@@@    
    @@@@@@@@%%#=--::..          .*##@@@@@@@@    
       @@@@@@@@@@%+-::.      :#@@@@@@@@@@       
          @@@@@@@@@@@@@@@@@@@@@@@@@@@@          
             @@@@@@@@@@@@@@@@@@@@@@             
                  @@@@@@@@@@@@@                 
                                                `)
    console.log("\x1b[32m", "Running Inboxer!", "\x1b[0m")
    console.log('Port: 8000');
})
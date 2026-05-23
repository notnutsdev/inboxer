const express = require("express");
const session = require("express-session");
const app = express();

const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync("./db/database.db");
const initDB = require("./utils/initdb");

const showdown = require("showdown");
const md_ext = require("./utils/md_extensions");
const converter = new showdown.Converter({ tasklists: true, underline: true, strikethrough: true, parseImgDimensions: true, extensions: [ md_ext.hrTag, md_ext.videoTag, md_ext.codeBlock ] });

const validator = require("validator");

const config = require("./config.json");
const banned_words = require("./banned_words.json");

const { Webhook, MessageBuilder } = require("discord-webhook-node");

// Routers
const staffRoutes = require("./routes/staff");

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

// Registering routers
app.use("/", staffRoutes)

// Locals/Global variables
app.locals = config.locals;

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

    db.prepare(`
        INSERT INTO posts (uid, username, content, permissions) VALUES (?, ?, ?, ?);
    `).run(uuid, validator.escape(username), content, 0);

    res.redirect("/post/" + uuid);
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

// Route to load libraries
app.get("/libraries/:file", (req, res) => {
    const fp = config.libraries[req.params.file];

    if (!fp) return res.status(404).send("404 not found");

    res.sendFile(__dirname + fp)
})

// TODO: have routers instead of one big file

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
    console.log("\x1b[32mRunning Inboxer!", "\x1b[0m")
    console.log('Port: 8000');
})
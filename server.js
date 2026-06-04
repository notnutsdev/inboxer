const express = require("express");
const session = require("express-session");
const app = express();
const middleware = require('./routes/middleware');

const sequelize = require("./models/connection");
const initModels = require("./models/init");
const Post = require("./models/posts");
const User = require("./models/users");

const markdownToHTML = require('./utils/md_compile');

const validator = require("validator");

const config = require("./config.json");
const banned_words = require("./banned_words.json");

const { Webhook, MessageBuilder } = require("discord-webhook-node");

const fs = require("node:fs");
const validation = require('./utils/validation'); // internal validation utility (This is NOT the validator package)

const altcha = require('./utils/altcha');
const redis = require("./utils/redis.js");


// Loading environment variables
process.loadEnvFile("./.env");

// Routers
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");

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
}));
app.use(middleware.rateLimiter);

// Registering routers
app.use('/auth', authRoutes);
app.use("/", userRoutes);

// Locals/Global variables
app.locals = config.locals;

// Getting all the emoji stems (files in the /public/img/emojis folder)
app.locals.emojis = [];
fs.readdirSync("./public/img/emojis").forEach(value => {
    const emoj_split = value.split("."); // to get the stem and file ext
    app.locals.emojis.push({ stem: emoj_split[0], file_ext: emoj_split[1] });
})

// Captcha routes
app.get('/altcha/challenge', altcha.challengeHandler);
app.post('/altcha/verify', altcha.verifyHandler);

// Connect top the redis server
redis.connect().catch(() => {
    throw new Error("Could not connect to the redis server. Make sure you have Redis installed and running.")
});


app.get("/", async (req, res) => {
    User.hasMany(Post, {foreignKey: 'user_id'})
    Post.belongsTo(User, {foreignKey: 'user_id'})

    const posts = await Post.findAll({
        order: sequelize.random(),
        limit: 5,
        include: [{
            model: User,
            required: true
        }]
    });

    res.render("index.ejs", { posts: posts, user: req.session.user });
})

app.get('/create', (req, res) => {
    res.render("create.ejs", { user: req.session.user });
})

app.post('/create', (req, res, next) => { // to show captchas only to throwaway users
    if (req.session.user) {
        req.skipCaptcha = true;
    }
    next();
})
app.post('/create', middleware.checkAltcha) // check the actual captcha
app.post("/create", async (req, res) => {
    let user_id;
    let content = req.body.content;

    // Guards
    if (!content) {
        return res.render("create.ejs", { error: "Please enter some content." })
    }
    if (content.length < 5) {
        return res.render("create.ejs", { error: "Please enter more than 5 characters in the content field." })
    }

    for (let i = 0; i< banned_words.length; i++) {
        const word = banned_words[i];
        if (content.includes(word)) {
            return res.render("create.ejs", { error: "Your post contains banned words." });
        }
    }

    // For logged in users
    if (req.session.user) {
        user_id = req.session.user.uid;
    } /* For throwaway users */ else {
        const username = req.body.username;

        if (!username) {
            return res.render("create.ejs", { error: "Please enter a username" })
        }
        if (username.length > 30) return res.render("create.ejs", { error: "Username too long." });
        if (!validation.isValidUsername(username)) return res.render("create.ejs", { error: "Username can only contain letters (a-z), numbers and underscores." })

        const user = await User.create({ username: username, creation_date: Math.floor(Date.now()/1000), group: 0 });
        user_id = user.uid;
    }

    const uuid = crypto.randomUUID();
    const content_html = await markdownToHTML(content); // legacy: converter.makeHtml(validator.escape(content));
    const date = Math.floor(Date.now()/1000); // Current unix timestamp

    // Adding the record to the database
    const post = await Post.create({ uid: uuid, user_id: user_id, content_html: content_html, content_text: content, created_at: date, updated_at: date });

    // Adding post to the redis cache
    await redis.hSet("post-" + uuid, post.dataValues);

    res.redirect("/post/" + uuid);
})

app.get('/post/:uid', async (req, res) => {
    const uid = req.params.uid;
    
    User.hasMany(Post, {foreignKey: 'user_id'})
    Post.belongsTo(User, {foreignKey: 'user_id'})

    let post, author;

    // Try to get the post from the redis cache
    post = await redis.hGetAll('post-' + uid);

    // If the post is found in cache
    if (Object.keys(post).length > 0) {
        // Get the author
        author = await User.findOne({
            where: {
                uid: +post.user_id
            }
        });
    } else { // if the post isn't found, find it from the database

        post = await Post.findOne({
            where: {
                uid: uid
            },
            include: [{
                model: User,
                required: true
            }]
        });

        // If the post was still not found, return an error
        if (!post) {
            return res.render("view.ejs", { error: "No post found for this ID." });
        }

        author = post.dataValues.user;
        post = post.dataValues;
        delete post.user; // For the cache

        // Add the post to cache
        await redis.hSet("post-" + uid, post);
    };

    // If the user isn't found, assume it's a deleted user.
    if (!author) {
        author = {
            username: "Deleted User",
            group: -1 // Deleted users group
        }
    } else {
        author = author.dataValues;
        // Delete the user's password
        delete author.password;
    }

    // Open Graphs data for the post
    const og_data = {};
    // Get the text from the post (without the HTML tags) for Open Graphs meta tags
    og_data.description = post.content_html.replace(/\<(.*?)\>/gm, "").trim().substring(0, 50) + "...";

    res.render("view.ejs", { post: post, author: author, user: req.session.user, og_data: og_data });
});

app.get("/random", async (req, res) => {
    const post = await Post.findOne({ order: sequelize.random() });

    if (!post) return res.render("blank.ejs", { error: "No posts where found.", title: "Error" });

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
    const post = Post.findOne({ where: { uid: post_id }});

    if (!post) return res.render("report.ejs", { error: "Post with this ID doesn't exist in our records." });

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
    .addField("Post author username:", `\`${post.username}\``)
    .addField("Report message", `\`\`\`${message}\`\`\``)
    .setTimestamp();

    hook.send(embed)
    .catch(() => res.render("report.ejs", { error: "An error occured while sending your request. Our systems might be overwelhmed. Please try again later or contact us on Discord." }));

    res.render("report.ejs", { success: "Your report was successfully sent to our team!<br>You will receive an email when we review the post." })
})

app.route("/contact")
.get((req, res) => {
    res.render("contact.ejs", { subject: (req.query.subject) ? validator.escape(req.query.subject) : null });
})
.post((req, res) => {
    const email = req.body.email;
    const subject = req.body.subject;
    const message = req.body.message;

    if (!email || !subject || !message) {
        return res.render("contact.ejs", { error: "Please fill our all the form fields." });
    };

    if (!validator.isEmail(email)) return res.render("contact.ejs", { error: "Invalid email address." });
    if (subject.length <= 5) return res.render("contact.ejs", { error: "Subject too short." });
    if (message.length <= 10 || message.length > 1500) return res.render("contact.ejs", { error: "Your message must be between 10 and 1500 characters. For longer messages, please send us an email." });

    const webhooks = process.env.CONTACT_WEBHOOKS.split(",");
    const hook_url = webhooks[Math.floor(Math.random() * webhooks.length)]; // Get a random webhook URL.

    // Sending the message with the webhook
    const hook = new Webhook(hook_url);
    const embed = new MessageBuilder()
    .setColor("#fff")
    .setTitle("Contact message")
    .setAuthor(`Sent by: ${email}`)
    .addField("Subject", `\`${subject}\``)
    .addField("Message", `\`\`\`${message}\`\`\``)
    .setTimestamp();

    hook.send(embed)
    .catch(() => { return res.render("contact.ejs", { error: "An error occured while sending your request. Our systems might be overwelhmed. Please try again later or contact us on Discord." })});

    res.render("contact.ejs", { success: "You message was sent to our teams. You'll receive a reply to your email as soon as we get to you." })
});

// Delete a post
app.get("/delete/:uid", async (req, res) => {
    const uid = req.params.uid;

    if (!req.session.user) {
        return res.redirect("/");
    }
    
    // Fix DRY here
    User.hasMany(Post, {foreignKey: 'user_id'})
    Post.belongsTo(User, {foreignKey: 'user_id'})
    ///////////////

    const post = await Post.findOne({
        where: {
            uid: uid
        },
        include: [{
            model: User,
            required: true
        }]
    });


    if (!post) return res.redirect("/");

    // If the user isn't the post author and isn't a mod/admin
    if (post.user.uid != req.session.user.uid && req.session.user.group < 3) {
        return res.redirect("/");
    }

    await Post.destroy({
        where: {
            uid: uid
        }
    });

    // Delete post from cache
    const cached_post = await redis.hGetAll("post-" + uid);
    if (Object.keys(cached_post).length > 0) {
        await redis.del("post-" + uid);
    }

    // Log everything to the webhook log channel
    const hook = new Webhook(process.env.STAFF_LOGS_WEBHOOK);
    const embed = new MessageBuilder()
    .setAuthor(`Action taken by: ${req.session.user.username}`)
    .setTitle("Post deleted")
    .setColor("#fff")
    .addField("Post ID", `\`${uid}\``)
    .addField("Action", "Deletion")
    .addField("Post Author", `\`${post.user.username}\``)
    .addField("Original content", `\`\`\`${post.content_text}\`\`\``)
    .setTimestamp();
    hook.send(embed);

    return res.render("blank.ejs", { success: "Deleted post with ID: " + uid });
});

// Editing a post
app.all("/edit/:uid", middleware.checkLogin);
app.all("/edit/:uid", async (req, res, next) => {
    const post = await Post.findOne({
        where: {
            uid: req.params.uid
        }
    });

    if (!post) {
        return res.render("blank.ejs", { error: "Post not found.", user: req.session.user });
    }

    if (req.session.user.group < 3 && req.session.user.uid != post.user_id) {
        return res.render("blank.ejs", { error: "You cannot edit a post you didn't create.", user: req.session.user });
    }

    req.post = post;
    next();
});
app.get("/edit/:uid", async (req, res) => {
    return res.render("edit.ejs", { user: req.session.user, post: req.post });
})
app.post("/edit/:uid", async (req, res) => {
    const uid = req.post.uid;
    const content = req.body.content;

    if (content.length < 5) {
        return res.render('edit.ejs', { error: "Please enter more than 5 characters.", post: req.post, user: req.session.user })
    }

    const content_html = await markdownToHTML(content);
    const date = Math.floor(Date.now()/1000);

    await Post.update(
        {
            content_html: content_html,
            content_text: content,
            updated_at: date
        },
        {
            where: {
                uid: uid
            }
        }
    );

    // Update the request post object with the new data, for redis
    req.post.dataValues.content_html = content_html;
    req.post.dataValues.content_text = content;

    // Update/create post in cache
    await redis.hSet("post-" + uid, req.post.dataValues);

    return res.redirect("/post/" + req.post.uid);
})

// Logout the user
app.get("/logout", (req, res) => {
    if (!req.session.is_logged_in) {
        return res.redirect("/");
    }

    req.session.destroy();

    res.render("blank.ejs", { success: "Successfully logged you out!" })
});

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

    res.sendFile(__dirname + fp);
})


// Error handlers
// 404 page
app.use((req, res) => {
    res.status(404).render("error_page.ejs", { status: 404, message: "Seems like you got lost. This page doesn't exist" });
})
// 5xx pages
app.use((req, res) => {
    res.status(500).render("error_page.ejs", { status: 500, message: "Internal server error. Thats on us." })
})

/// Start the app
app.listen(8000, () => {
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

    // Test the database connection
    try {
        sequelize.authenticate();
        console.log("Connection to database was successfull!");
    } catch (error) {
        throw new Error("Database connection failed.")
    }

    // Init models
    initModels();

    console.log("\x1b[32mRunning Inboxer!", "\x1b[0m")
    console.log('Port: 8000');
})